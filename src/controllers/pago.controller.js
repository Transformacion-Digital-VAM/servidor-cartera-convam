const pool = require('../config/db');

// ----------------------------------------------------
// REGISTRAR PAGO (FINAL, CORREGIDO Y ROBUSTO)
// ----------------------------------------------------

const registrarPago = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      credito_id,
      moratorios = 0,
      pago_registrado = 0,
      tipo_pago,
      registrado_por
    } = req.body;

    // Validaciones básicas
    if (!credito_id) return res.status(400).json({ error: 'Falta el credito_id' });
    if (!registrado_por) return res.status(400).json({ error: 'Falta registrado_por' });

    const pagoRegistradoNum = Number(pago_registrado) || 0;
    const moratoriosNum = Number(moratorios) || 0;
    const totalPago = pagoRegistradoNum + moratoriosNum;

    // ------------------------------------------------
    // 1) Obtener pagaré asociado al crédito
    // ------------------------------------------------
    const pagareRes = await client.query(
      `SELECT id_pagare FROM pagare WHERE credito_id = $1`,
      [credito_id]
    );

    if (pagareRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No existe pagaré para este crédito' });
    }

    const pagare_id = pagareRes.rows[0].id_pagare;

    // ------------------------------------------------
    // 2) Obtener saldo pendiente del crédito y tasa moratoria
    // ------------------------------------------------
    const creditoRes = await client.query(
      `SELECT saldo_pendiente, tasa_moratoria, total_a_pagar FROM credito WHERE id_credito = $1`,
      [credito_id]
    );

    if (creditoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Crédito no encontrado' });
    }

    const saldoPendienteActual = Number(creditoRes.rows[0].saldo_pendiente) || 0;
    const totalAPagar = Number(creditoRes.rows[0].total_a_pagar) || 0;
    const tasaMoratoria = Number(creditoRes.rows[0].tasa_moratoria) || 0;

    // Si es el primer pago, usar total_a_pagar como saldo inicial
    const saldoInicial = saldoPendienteActual === 0 ? totalAPagar : saldoPendienteActual;
    const nuevoSaldoPendiente = saldoInicial - totalPago;

    // ------------------------------------------------
    // 3) Registrar pago en tabla `pago`
    // ------------------------------------------------
    const insertPagoSQL = `
      INSERT INTO pago (
        credito_id,
        pagare_id,
        fecha_operacion,
        moratorios,
        total_pago,
        tipo_pago,
        registrado_por,
        tasa_moratoria,
        pago_registrado,
        saldo_despues
      )
      VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const pagoInserted = await client.query(insertPagoSQL, [
      credito_id,
      pagare_id,
      moratoriosNum,
      totalPago,
      tipo_pago,
      registrado_por,
      tasaMoratoria,
      pagoRegistradoNum,
      (nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente)
    ]);

    const pagoRow = pagoInserted.rows[0];
    const pagoId = pagoRow.id_pago;

    // ------------------------------------------------
    // 4) Impactar pago en calendario_pago
    // ------------------------------------------------
    let montoRestante = pagoRegistradoNum;
    let acumuladoCapital = 0;
    let acumuladoInteres = 0;

    // Obtener semanas ordenadas por número de pago
    const semanasRes = await client.query(`
      SELECT 
        id_calendario, 
        numero_pago,
        fecha_vencimiento,
        capital,
        interes,
        total_semana,
        COALESCE(monto_pagado, 0) AS monto_pagado,
        COALESCE(pagado, false) AS pagado,
        COALESCE(estatus, 'PENDIENTE') AS estatus
      FROM calendario_pago
      WHERE pagare_id = $1
      ORDER BY numero_pago ASC
    `, [pagare_id]);

    // Verificar mora para cada semana vencida
    const hoy = new Date();

    for (const semana of semanasRes.rows) {
      if (montoRestante <= 0) break;

      const idCalendario = semana.id_calendario;
      const totalSemana = Number(semana.total_semana) || 0;
      const yaPagado = Number(semana.monto_pagado) || 0;
      const faltanteSemana = totalSemana - yaPagado;
      const capitalSemana = Number(semana.capital) || 0;
      const interesSemana = Number(semana.interes) || 0;
      const fechaVencimiento = new Date(semana.fecha_vencimiento);

      // Calcular mora si la fecha de vencimiento ya pasó y no está pagada
      let moraCalculada = 0;
      if (fechaVencimiento < hoy && semana.estatus !== 'PAGADO') {
        const diasAtraso = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
        if (diasAtraso > 0) {
          // Calcular mora sobre el faltante
          moraCalculada = (faltanteSemana * (tasaMoratoria / 100) / 30) * diasAtraso;
        }
      }

      // Actualizar mora acumulada
      if (moraCalculada > 0) {
        await client.query(`
          UPDATE calendario_pago
          SET mora_acumulada = COALESCE(mora_acumulada, 0) + $1
          WHERE id_calendario = $2
        `, [moraCalculada, idCalendario]);
      }

      if (faltanteSemana <= 0) continue;

      // Calcular cuánto aplicar de este pago
      const aplicar = Math.min(montoRestante, faltanteSemana);
      const proporcion = aplicar / totalSemana;

      const capitalAAplicar = capitalSemana * proporcion;
      const interesAAplicar = interesSemana * proporcion;

      const nuevoMontoPagado = yaPagado + aplicar;
      const nuevoEstado = nuevoMontoPagado >= totalSemana ? 'PAGADO' : 'PAGO PARCIAL';
      const pagadoCompleto = nuevoEstado === 'PAGADO';

      // Actualizar el registro del calendario
      await client.query(`
        UPDATE calendario_pago
        SET 
          monto_pagado = $1,
          pagado = $2,
          estatus = $3,
          fecha_pago = CASE WHEN $4 > 0 THEN NOW() ELSE fecha_pago END
        WHERE id_calendario = $5
      `, [
        nuevoMontoPagado,
        pagadoCompleto,
        nuevoEstado,
        aplicar,
        idCalendario
      ]);

      acumuladoCapital += capitalAAplicar;
      acumuladoInteres += interesAAplicar;
      montoRestante -= aplicar;
    }

    // ------------------------------------------------
    // 5) Actualizar detalles del pago
    // ------------------------------------------------
    await client.query(`
      UPDATE pago
      SET
        capital_pagado = $1,
        interes_pagado = $2
      WHERE id_pago = $3
    `, [acumuladoCapital, acumuladoInteres, pagoId]);

    // ------------------------------------------------
    // 6) Actualizar saldo del crédito
    // ------------------------------------------------
    await client.query(`
      UPDATE credito
      SET saldo_pendiente = $1
      WHERE id_credito = $2
    `, [(nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente), credito_id]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Pago registrado correctamente',
      pago: {
        ...pagoRow,
        capital_pagado: acumuladoCapital,
        interes_pagado: acumuladoInteres,
        saldo_despues: (nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente)
      },
      nuevo_saldo: (nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar pago:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// ----------------------------------------------------
// CONSULTAR TODOS LOS PAGOS
// ----------------------------------------------------
const consultarPagos = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT *
      FROM pago
      ORDER BY fecha_operacion DESC
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar pagos:', error);
    res.status(500).json({ error: 'Error al consultar pagos' });
  }
};

// ----------------------------------------------------
// CONSULTAR PAGOS POR CLIENTE
// ----------------------------------------------------
const consultarPagosCliente = async (req, res) => {
  const { id_cliente } = req.params;

  try {
    const resultado = await pool.query(`
      SELECT p.*, c.id_credito
      FROM pago p
      INNER JOIN pagare pg ON p.pagare_id = pg.id_pagare
      INNER JOIN credito c ON pg.credito_id = c.id_credito
      INNER JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      WHERE s.cliente_id = $1
      ORDER BY p.fecha_operacion DESC
    `, [id_cliente]);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar pagos del cliente:', error);
    res.status(500).json({ error: 'Error al consultar pagos del cliente' });
  }
};

// ----------------------------------------------------
// EDITAR PAGO
// ----------------------------------------------------
const editarPago = async (req, res) => {
  const { id_pago } = req.params;
  const { moratorios, pago_registrado, tipo_pago } = req.body;

  try {
    const result = await pool.query(`
      UPDATE pago
      SET
        moratorios = COALESCE($1, moratorios),
        pago_registrado = COALESCE($2, pago_registrado),
        total_pago = COALESCE($1, moratorios) + COALESCE($2, pago_registrado),
        tipo_pago = COALESCE($3, tipo_pago)
      WHERE id_pago = $4
      RETURNING *;
    `, [moratorios, pago_registrado, tipo_pago, id_pago]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ message: 'Pago editado correctamente', pago: result.rows[0] });
  } catch (error) {
    console.error('Error al editar pago:', error);
    res.status(500).json({ error: 'Error al editar pago' });
  }
};

// ----------------------------------------------------
// ELIMINAR PAGO
// ----------------------------------------------------
const eliminarPago = async (req, res) => {
  const { id_pago } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM pago WHERE id_pago = $1 RETURNING *',
      [id_pago]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
};


const consultarPagosPorCredito = async (req, res) => {
  const { credito_id } = req.params;

  try {
    const resultado = await pool.query(`
      SELECT * FROM pago WHERE credito_id = $1 ORDER BY fecha_operacion DESC
    `, [credito_id]);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al consultar pagos del crédito' });
  }
};


module.exports = {
  registrarPago,
  consultarPagos,
  consultarPagosCliente,
  consultarPagosPorCredito,
  editarPago,
  eliminarPago
};
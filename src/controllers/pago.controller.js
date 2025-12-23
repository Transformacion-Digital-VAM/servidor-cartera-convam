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
      numero_pago,           // NUEVO: número de pago específico
      moratorios = 0,
      pago_registrado = 0,
      tipo_pago = 'PAGO NORMAL',
      registrado_por,
      // aplicar_a_mora = false  // NUEVO: opción para aplicar a mora primero
    } = req.body;

    // Validaciones básicas
    if (!credito_id) return res.status(400).json({ error: 'Falta el credito_id' });
    if (!registrado_por) return res.status(400).json({ error: 'Falta registrado_por' });
    if (!numero_pago && numero_pago !== 0) return res.status(400).json({ error: 'Falta numero_pago' });

    const pagoRegistradoNum = Number(pago_registrado) || 0;
    const moratoriosNum = Number(moratorios) || 0;
    const totalPago = pagoRegistradoNum + moratoriosNum;
    const numPago = Number(numero_pago);

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
    // 2) Obtener datos del crédito
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

    const saldoInicial = saldoPendienteActual === 0 ? totalAPagar : saldoPendienteActual;
    const nuevoSaldoPendiente = saldoInicial - totalPago;

    // ------------------------------------------------
    // 3) Obtener la semana específica del calendario
    // ------------------------------------------------
    const semanaRes = await client.query(`
      SELECT 
        id_calendario, 
        numero_pago,
        fecha_vencimiento,
        capital,
        interes,
        total_semana,
        COALESCE(monto_pagado, 0) AS monto_pagado,
        COALESCE(pagado, false) AS pagado,
        COALESCE(estatus, 'PENDIENTE') AS estatus,
        COALESCE(mora_acumulada, 0) AS mora_acumulada
      FROM calendario_pago
      WHERE pagare_id = $1 AND numero_pago = $2
    `, [pagare_id, numPago]);

    if (semanaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `No existe el pago número ${numPago} para este crédito` });
    }

    const semana = semanaRes.rows[0];
    const idCalendario = semana.id_calendario;
    const totalSemana = Number(semana.total_semana) || 0;
    const yaPagado = Number(semana.monto_pagado) || 0;
    const faltanteSemana = totalSemana - yaPagado;
    const capitalSemana = Number(semana.capital) || 0;
    const interesSemana = Number(semana.interes) || 0;
    const fechaVencimiento = new Date(semana.fecha_vencimiento);
    const moraAcumulada = Number(semana.mora_acumulada) || 0;

    // Verificar si ya está completamente pagado
    if (faltanteSemana <= 0 && moraAcumulada <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `El pago número ${numPago} ya está completamente cubierto` });
    }

    // ------------------------------------------------
    // 4) Calcular mora si la fecha ya pasó
    // ------------------------------------------------
    const hoy = new Date();
    let nuevaMora = 0;
    let moraPagada = 0;

    if (fechaVencimiento < hoy && semana.estatus !== 'PAGADO') {
      const diasAtraso = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
      if (diasAtraso > 0) {
        // Calcular mora sobre el faltante
        nuevaMora = (faltanteSemana * (tasaMoratoria / 100) / 30) * diasAtraso;

        // Si hay mora acumulada previa, sumarla
        const moraTotal = moraAcumulada + nuevaMora;

        // Opción: aplicar pago primero a mora
        // if (aplicar_a_mora && moraTotal > 0 && pagoRegistradoNum > 0) {
        //   moraPagada = Math.min(pagoRegistradoNum, moraTotal);
        //   pagoRegistradoNum -= moraPagada;
        // }
      }
    }

    // ------------------------------------------------
    // 5) Actualizar mora acumulada
    // ------------------------------------------------
    const moraRestante = Math.max(0, (moraAcumulada + nuevaMora) - moraPagada);

    if (nuevaMora > 0) {
      await client.query(`
        UPDATE calendario_pago
        SET mora_acumulada = $1
        WHERE id_calendario = $2
      `, [moraRestante, idCalendario]);
    }

    // ------------------------------------------------
    // 6) Aplicar pago al capital/interés de la semana
    // ------------------------------------------------
    let capitalPagado = 0;
    let interesPagado = 0;
    let montoAplicadoASemana = 0;
    let nuevoMontoPagado = yaPagado;
    let nuevoEstado = semana.estatus;
    let pagadoCompleto = semana.pagado;

    if (pagoRegistradoNum > 0 && faltanteSemana > 0) {
      const aplicar = Math.min(pagoRegistradoNum, faltanteSemana);
      const proporcion = aplicar / totalSemana;

      capitalPagado = capitalSemana * proporcion;
      interesPagado = interesSemana * proporcion;
      montoAplicadoASemana = aplicar;

      nuevoMontoPagado = yaPagado + aplicar;
      nuevoEstado = nuevoMontoPagado >= totalSemana ? 'PAGADO' : 'PAGO PARCIAL';
      pagadoCompleto = nuevoEstado === 'PAGADO';
    }

    // ------------------------------------------------
    // 7) Actualizar calendario_pago
    // ------------------------------------------------
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
      montoAplicadoASemana,
      idCalendario
    ]);

    // ------------------------------------------------
    // 8) Registrar pago en tabla `pago` (historial)
    // ------------------------------------------------
    const insertPagoSQL = `
      INSERT INTO pago (
        credito_id,
        pagare_id,
        numero_pago,        -- NUEVO: registrar a qué pago se aplicó
        fecha_operacion,
        moratorios,
        total_pago,
        tipo_pago,
        registrado_por,
        tasa_moratoria,
        pago_registrado,
        capital_pagado,
        interes_pagado,
        mora_pagada,        -- NUEVO: mora pagada en este registro
        saldo_despues
      )
      VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *;
    `;

    const pagoInserted = await client.query(insertPagoSQL, [
      credito_id,
      pagare_id,
      numPago,                    
      moratoriosNum,
      totalPago,
      tipo_pago,
      registrado_por,
      tasaMoratoria,
      pagoRegistradoNum,
      capitalPagado,
      interesPagado,
      moraPagada,                 
      (nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente)
    ]);

    const pagoRow = pagoInserted.rows[0];

    // ------------------------------------------------
    // 9) Actualizar saldo del crédito
    // ------------------------------------------------
    await client.query(`
      UPDATE credito
      SET saldo_pendiente = $1
      WHERE id_credito = $2
    `, [(nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente), credito_id]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Pago registrado correctamente',
      detalle: {
        semana_aplicada: numPago,
        monto_semana: montoAplicadoASemana,
        mora_pagada: moraPagada,
        capital_pagado: capitalPagado,
        interes_pagado: interesPagado,
        mora_acumulada: moraRestante,
        estado_semana: nuevoEstado
      },
      pago: pagoRow,
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

// helper
// Agrega esta función helper en tu controlador o en un archivo aparte
function calcularDiasAtraso(fechaVencimiento) {
  if (!fechaVencimiento) return 0;

  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);

  // Resetear horas para comparar solo fechas
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  const diferenciaMs = hoy - vencimiento;
  const diasAtraso = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  return diasAtraso > 0 ? diasAtraso : 0;
}

const obtenerSemanasPendientes = async (req, res) => {
  const { credito_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        cp.numero_pago,
        cp.fecha_vencimiento,
        cp.capital,
        cp.interes,
        cp.total_semana,
        cp.monto_pagado,
        cp.mora_acumulada,
        cp.estatus,
        cp.fecha_pago,
        (cp.total_semana - COALESCE(cp.monto_pagado, 0)) as faltante,
        -- Calcular días de atraso dinámicamente
        CASE 
          WHEN cp.fecha_vencimiento < CURRENT_DATE 
               AND cp.estatus != 'PAGADO'
          THEN CURRENT_DATE - cp.fecha_vencimiento
          ELSE 0 
        END as dias_atraso,
        -- Calcular mora pendiente dinámicamente
        CASE 
          WHEN cp.fecha_vencimiento < CURRENT_DATE 
               AND cp.estatus != 'PAGADO'
          THEN (
            (cp.total_semana - COALESCE(cp.monto_pagado, 0)) * 
            (c.tasa_moratoria / 100) / 30 * 
            (CURRENT_DATE - cp.fecha_vencimiento)
          )
          ELSE 0 
        END as mora_pendiente_calculada
      FROM calendario_pago cp
      JOIN pagare p ON cp.pagare_id = p.id_pagare
      JOIN credito c ON p.credito_id = c.id_credito
      WHERE p.credito_id = $1
        AND (cp.estatus != 'PAGADO' OR cp.mora_acumulada > 0)
      ORDER BY cp.numero_pago ASC
    `, [credito_id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener semanas pendientes' });
  }
};


module.exports = {
  registrarPago,
  consultarPagos,
  consultarPagosCliente,
  consultarPagosPorCredito,
  editarPago,
  eliminarPago,
  obtenerSemanasPendientes,
  calcularDiasAtraso
};
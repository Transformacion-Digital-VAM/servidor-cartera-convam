const pool = require('../config/db');

// ----------------------------------------------------
// REGISTRAR PAGO
// ----------------------------------------------------
const registrarPago = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      credito_id,
      numero_pago = null,    // AHORA: opcional
      moratorios = 0,
      pago_registrado = 0,
      tipo_pago = 'PAGO NORMAL',
      registrado_por,
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
    // 3) Obtener todas las semanas pendientes ordenadas
    // ------------------------------------------------
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
        COALESCE(estatus, 'PENDIENTE') AS estatus,
        COALESCE(mora_acumulada, 0) AS mora_acumulada
      FROM calendario_pago
      WHERE pagare_id = $1
      ORDER BY fecha_vencimiento ASC, numero_pago ASC
    `, [pagare_id]);

    if (semanasRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No se encontró calendario de pagos para este crédito' });
    }

    // Determinar qué semana procesar
    let startIndex = -1;
    if (numero_pago !== null && numero_pago !== undefined) {
      startIndex = semanasRes.rows.findIndex(s => s.numero_pago === Number(numero_pago));
    } else {
      // Si no viene numero_pago, buscar la primera semana no pagada (o con mora)
      startIndex = semanasRes.rows.findIndex(s => !s.pagado || Number(s.mora_acumulada) > 0);
    }

    if (startIndex === -1) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: numero_pago !== null ? `No existe la semana ${numero_pago} en el calendario` : 'Ya no hay semanas pendientes para este crédito'
      });
    }

    // El numPago que se guardará en el historial: el de la semana donde inicia el pago
    const numPagoEfectivo = semanasRes.rows[startIndex].numero_pago;

    // Filtrar semanas a procesar (desde la inicial que no estén pagadas o tengan mora)
    const semanasAProcesar = semanasRes.rows.slice(startIndex).filter(s => !s.pagado || Number(s.mora_acumulada) > 0);

    if (semanasAProcesar.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `La semana ${numPagoEfectivo} y las siguientes ya están pagadas` });
    }

    // Variables para el procesamiento UNIFICADO
    let poolRestante = totalPago;
    let pagosAplicados = [];
    let totalCapitalPagado = 0;
    let totalInteresPagado = 0;
    let totalMoraPagada = 0;
    const hoy = new Date();

    // ------------------------------------------------
    // 4) Procesar el pago en cascada (Pool Unificado)
    // ------------------------------------------------
    for (const semana of semanasAProcesar) {
      if (poolRestante <= 0) break;

      const idCalendario = semana.id_calendario;
      const totalSemana = Number(semana.total_semana) || 0;
      const yaPagado = Number(semana.monto_pagado) || 0;
      const faltanteSemana = Math.max(0, totalSemana - yaPagado);
      const capitalSemana = Number(semana.capital) || 0;
      const interesSemana = Number(semana.interes) || 0;
      const fechaVencimiento = new Date(semana.fecha_vencimiento);
      let moraDeSemana = Number(semana.mora_acumulada) || 0;

      // Calcular mora adicional si está vencida y no estaba ya pagada
      if (fechaVencimiento < hoy && !semana.pagado) {
        const diasAtraso = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
        if (diasAtraso > 0) {
          const moraCalculada = (faltanteSemana * (tasaMoratoria / 100) / 30) * diasAtraso;
          moraDeSemana += moraCalculada;
        }
      }

      // A) Primero liquidar MORA de esta semana
      let moraPagadaEnSemana = 0;
      if (poolRestante > 0 && moraDeSemana > 0) {
        moraPagadaEnSemana = Math.min(poolRestante, moraDeSemana);
        poolRestante -= moraPagadaEnSemana;
        moraDeSemana -= moraPagadaEnSemana;
        totalMoraPagada += moraPagadaEnSemana;
      }

      // B) Luego liquidar CAPITAL/INTERÉS de esta semana
      let capitalPagadoEnSemana = 0;
      let interesPagadoEnSemana = 0;
      let montoAplicadoASemana = 0;
      let nuevoMontoPagado = yaPagado;

      if (poolRestante > 0 && faltanteSemana > 0) {
        const aplicar = Math.min(poolRestante, faltanteSemana);
        const proporcion = aplicar / totalSemana;

        capitalPagadoEnSemana = capitalSemana * proporcion;
        interesPagadoEnSemana = interesSemana * proporcion;

        montoAplicadoASemana = aplicar;
        poolRestante -= aplicar;

        nuevoMontoPagado = yaPagado + aplicar;
        totalCapitalPagado += capitalPagadoEnSemana;
        totalInteresPagado += interesPagadoEnSemana;
      }

      // Determinar estado final de la semana
      const pagadoCompleto = nuevoMontoPagado >= (totalSemana - 0.01) && moraDeSemana <= 0.01;
      const nuevoEstado = pagadoCompleto ? 'PAGADO' : (nuevoMontoPagado > 0 ? 'PAGO PARCIAL' : 'PENDIENTE');

      // Actualizar semana en BD
      await client.query(`
        UPDATE calendario_pago
        SET 
          monto_pagado = $1,
          pagado = $2,
          estatus = $3,
          mora_acumulada = $4,
          fecha_pago = CASE WHEN $5 > 0 THEN NOW() ELSE fecha_pago END
        WHERE id_calendario = $6
      `, [
        nuevoMontoPagado,
        pagadoCompleto,
        nuevoEstado,
        Math.max(0, moraDeSemana),
        montoAplicadoASemana + moraPagadaEnSemana,
        idCalendario
      ]);

      pagosAplicados.push({
        numero_pago: semana.numero_pago,
        monto_pago: montoAplicadoASemana,
        mora_pagada: moraPagadaEnSemana,
        estado: nuevoEstado
      });
    }

    // El saldo restante del pool (si sobra) se considera "excedente" que no se pudo aplicar 
    // porque se acabaron las semanas pendientes o hay una discrepancia.
    // En este sistema, no permitimos saldo a favor sin semana vinculada.
    if (poolRestante > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'El monto excede la deuda total de las semanas procesadas',
        sobrante: poolRestante
      });
    }

    // ------------------------------------------------
    // 5) Registrar en historial de pagos
    // ------------------------------------------------
    const insertPagoSQL = `
      INSERT INTO pago (
        credito_id, pagare_id, numero_pago, fecha_operacion,
        moratorios, total_pago, tipo_pago, registrado_por,
        tasa_moratoria, pago_registrado, capital_pagado,
        interes_pagado, mora_pagada, saldo_despues
      )
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    // Registramos el total de lo que se aplicó efectivamente (totalPago - poolRestante)
    const montoEfectivo = totalPago - poolRestante;

    const resultHistorial = await client.query(insertPagoSQL, [
      credito_id, pagare_id, numPagoEfectivo,
      moratoriosNum, montoEfectivo, tipo_pago, registrado_por,
      tasaMoratoria, (montoEfectivo - totalMoraPagada), totalCapitalPagado,
      totalInteresPagado, totalMoraPagada,
      Math.max(0, nuevoSaldoPendiente)
    ]);

    const pagoRow = resultHistorial.rows[0];

    // ------------------------------------------------
    // 6) Actualizar saldo del crédito
    // ------------------------------------------------
    await client.query(`
      UPDATE credito
      SET saldo_pendiente = $1
      WHERE id_credito = $2
    `, [Math.max(0, nuevoSaldoPendiente), credito_id]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Pago registrado correctamente',
      detalle: {
        total_aplicado: montoEfectivo,
        semanas_afectadas: pagosAplicados,
        total_capital: totalCapitalPagado,
        total_interes: totalInteresPagado,
        total_mora: totalMoraPagada,
        cambio_registrado: poolRestante
      },
      pago: pagoRow,
      nuevo_saldo: Math.max(0, nuevoSaldoPendiente)
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
function calcularDiasAtraso(fechaVencimiento, fechaReferencia = new Date()) {
  if (!fechaVencimiento) return 0;

  const referencia = new Date(fechaReferencia);
  const vencimiento = new Date(fechaVencimiento);

  // Resetear horas
  referencia.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  const diferenciaMs = referencia - vencimiento;
  const diasAtraso = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diasAtraso);
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
        -- Faltante por pagar
        (cp.total_semana - COALESCE(cp.monto_pagado, 0)) as faltante,
        -- Días de atraso: forma más simple y segura
        CASE 
          WHEN cp.fecha_vencimiento < CURRENT_DATE 
               AND cp.estatus != 'PAGADO'
          THEN (CURRENT_DATE - cp.fecha_vencimiento)
          ELSE 0 
        END as dias_atraso,
        -- Mora calculada al momento
        CASE 
          WHEN cp.fecha_vencimiento < CURRENT_DATE 
               AND cp.estatus != 'PAGADO'
          THEN (
            (cp.total_semana - COALESCE(cp.monto_pagado, 0)) * 
            (c.tasa_moratoria / 100) / 30 * 
            (CURRENT_DATE - cp.fecha_vencimiento)
          )
          ELSE 0 
        END as mora_pendiente
      FROM calendario_pago cp
      JOIN pagare p ON cp.pagare_id = p.id_pagare
      JOIN credito c ON p.credito_id = c.id_credito
      WHERE p.credito_id = $1
        AND (cp.estatus != 'PAGADO' OR cp.mora_acumulada > 0)
      ORDER BY 
        CASE 
          WHEN cp.fecha_vencimiento < CURRENT_DATE THEN 0
          ELSE 1 
        END,
        cp.numero_pago ASC
    `, [credito_id]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener semanas pendientes:", error);
    res.status(500).json({
      error: 'Error al obtener semanas pendientes',
      detalle: error.message
    });
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
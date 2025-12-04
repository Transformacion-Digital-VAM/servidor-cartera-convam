const pool = require('../config/db');

// ----------------------------------------------------
// REGISTRAR PAGO (ACTUALIZADO CON saldo_pendiente)
// ----------------------------------------------------
const registrarPago = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      credito_id,
      moratorios = 0,
      pago_registrado = 0,
      tipo_pago = "PAGO NORMAL",
      registrado_por
    } = req.body;

    if (!credito_id) {
      return res.status(400).json({ error: "Falta el credito_id" });
    }

    if (!registrado_por) {
      return res.status(400).json({ error: "Falta registrado_por" });
    }

    // --------------------------------------------
    // 1. Obtener saldo pendiente actual del crédito
    // --------------------------------------------
    const creditoResult = await client.query(
      `SELECT saldo_pendiente, tasa_moratoria
       FROM credito
       WHERE id_credito = $1`,
      [credito_id]
    );

    if (creditoResult.rows.length === 0) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    const saldoPendienteActual = Number(creditoResult.rows[0].saldo_pendiente);
    const tasaMoratoria = Number(creditoResult.rows[0].tasa_moratoria);

    // --------------------------------------------
    // 2. Calcular el total del pago
    // --------------------------------------------
    const total_pago = pago_registrado + moratorios;

    // Nuevo saldo después del pago
    const nuevoSaldoPendiente = saldoPendienteActual - total_pago;

    // Pago pendiente (solo para registro histórico)
    const pago_pendiente = nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente;

    // --------------------------------------------
    // 3. Registrar el pago
    // --------------------------------------------
    const pagoInsert = `
      INSERT INTO pago (
        credito_id, fecha_operacion, 
        moratorios, total_pago, tipo_pago, registrado_por,
        tasa_moratoria, pago_registrado, pago_pendiente
      )
      VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const pagoResult = await client.query(pagoInsert, [
      credito_id,
      moratorios,
      total_pago,
      tipo_pago,
      registrado_por,
      tasaMoratoria,
      pago_registrado,
      pago_pendiente
    ]);

    // --------------------------------------------
    // 4. Actualizar crédito con nuevo saldo
    // --------------------------------------------
    await client.query(
      `UPDATE credito
       SET saldo_pendiente = $1
       WHERE id_credito = $2`,
      [nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente, credito_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Pago registrado correctamente",
      pago: pagoResult.rows[0],
      nuevo_saldo: nuevoSaldoPendiente < 0 ? 0 : nuevoSaldoPendiente
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar pago:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
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
      INNER JOIN credito c ON p.credito_id = c.id_credito
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
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    res.json({ message: "Pago editado correctamente", pago: result.rows[0] });

  } catch (error) {
    console.error("Error al editar pago:", error);
    res.status(500).json({ error: "Error al editar pago" });
  }
};


// ----------------------------------------------------
// ELIMINAR PAGO
// ----------------------------------------------------
const eliminarPago = async (req, res) => {
  const { id_pago } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM pago WHERE id_pago = $1 RETURNING *",
      [id_pago]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    res.json({ message: "Pago eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({ error: "Error al eliminar pago" });
  }
};


module.exports = {
  registrarPago,
  consultarPagos,
  consultarPagosCliente,
  editarPago,
  eliminarPago
};

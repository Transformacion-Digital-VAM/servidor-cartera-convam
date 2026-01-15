const pool = require('../config/db');

// -------------------------------------------
// Crear crédito con cálculo automático
// -------------------------------------------
const guardarCredito = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const {
      solicitud_id,
      fecha_ministracion,
      fecha_primer_pago,
      referencia_bancaria,
      tipo_credito,
      cuenta_bancaria,
      seguro,
      tipo_servicio = "Préstamo personal",
      tasa_moratoria = 50
    } = req.body;

    if (!solicitud_id) {
      return res.status(400).json({ error: "solicitud_id es obligatorio" });
    }

    // -------------------------------------------
    // 1. Obtener datos de la solicitud
    // -------------------------------------------
    const solicitudResult = await client.query(
      `SELECT monto_aprobado, aliado_id, aval_id
       FROM solicitud 
       WHERE id_solicitud = $1`,
      [solicitud_id]
    );

    if (solicitudResult.rows.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const { monto_aprobado, aliado_id, aval_id } = solicitudResult.rows[0];

    const total_capital = Number(monto_aprobado);

    // -------------------------------------------
    // 2. Obtener tasa del aliado
    // -------------------------------------------
    const aliadoResult = await client.query(
      `SELECT tasa_fija FROM aliado WHERE id_aliado = $1`,
      [aliado_id]
    );

    if (aliadoResult.rows.length === 0) {
      return res.status(404).json({ error: "Aliado no encontrado" });
    }

    const tasa_fija = Number(aliadoResult.rows[0].tasa_fija);

    // -------------------------------------------
    // 3. Calcular costos
    // -------------------------------------------
    const totalInteres = (total_capital * tasa_fija) / 4 * 16;
    const totalGarantia = total_capital * 0.10;
    const total_seguro = seguro ? 80 : 0;
    const totalAPagar = total_capital + totalInteres;

    const pago_semanal = totalAPagar / 16;

    // Nuevo campo acorde al cambio en la BD
    const saldo_pendiente = totalAPagar;

    // -------------------------------------------
    // 4. Insertar crédito según estructura REAL
    // -------------------------------------------
    const creditoResult = await client.query(
      `INSERT INTO credito (
        solicitud_id, fecha_ministracion, fecha_primer_pago,
        referencia_bancaria, tipo_credito, cuenta_bancaria,
        total_capital, total_interes, total_seguro,
        total_a_pagar, total_garantia, tipo_servicio,
        aliado_id, seguro, tasa_fija, aval_id,
        pago_semanal, tasa_moratoria, saldo_pendiente, estado_credito
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, 'PENDIENTE')
      RETURNING *`,
      [
        solicitud_id,
        fecha_ministracion,
        fecha_primer_pago,
        referencia_bancaria,
        tipo_credito,
        cuenta_bancaria,
        total_capital,
        totalInteres,
        total_seguro,
        totalAPagar,
        totalGarantia,
        tipo_servicio,
        aliado_id,
        seguro,
        tasa_fija,
        aval_id,
        pago_semanal,
        tasa_moratoria,
        saldo_pendiente
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Crédito registrado correctamente",
      credito: creditoResult.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error guardarCredito:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// -------------------------------------------
// Editar crédito
// -------------------------------------------
const editarCredito = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const id_credito = req.params.id;
    const { fecha_ministracion, fecha_primer_pago, seguro, estado_credito } = req.body;

    const result = await client.query(
      `
      UPDATE credito SET
        fecha_ministracion = COALESCE($1, fecha_ministracion),
        fecha_primer_pago = COALESCE($2, fecha_primer_pago),
        seguro = COALESCE($3, seguro),
        estado_credito = COALESCE($4, estado_credito)
      WHERE id_credito = $5
      RETURNING *;
      `,
      [
        fecha_ministracion || null,
        fecha_primer_pago || null,
        seguro !== undefined ? seguro : null,
        estado_credito !== undefined ? estado_credito : null,
        id_credito
      ]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Crédito actualizado correctamente",
      credito: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Error editarCredito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// -------------------------------------------
// Cambiar estado_credito del crédito (ENTREGADO / DEVOLUCION)
// -------------------------------------------
const actualizarEstadoCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_credito } = req.body;
    if (!["PENDIENTE", "ENTREGADO", "DEVOLUCIÓN", "FINALIZADO"].includes(estado_credito)) {

      return res.status(400).json({ error: "Estado inválido" });
    }

    const result = await pool.query(
      `UPDATE credito
       SET estado_credito = $1
       WHERE id_credito = $2
       RETURNING *`,
      [estado_credito, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    res.json({
      message: "Estado actualizado correctamente",
      credito: result.rows[0]
    });

  } catch (error) {
    console.error("Error actualizarEstadoCredito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// -------------------------------------------
// Eliminar crédito
// -------------------------------------------
const eliminarCredito = async (req, res) => {
  try {
    const id_credito = req.params.id;

    await pool.query("DELETE FROM garantia WHERE credito_id = $1", [id_credito]);

    const result = await pool.query(
      "DELETE FROM credito WHERE id_credito = $1 RETURNING *",
      [id_credito]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    res.json({ message: "Crédito eliminado correctamente" });

  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
    console.log("Error eliminarCredito:", error);
  }
};

// -------------------------------------------
// Obtener todos los créditos
// -------------------------------------------
// const obtenerCreditos = async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT c.*, s.cliente_id
//       FROM credito c
//       LEFT JOIN solicitud s ON s.id_solicitud = c.solicitud_id
//       ORDER BY c.id_credito DESC
//     `);

//     res.json(result.rows);

//   } catch (error) {
//     res.status(500).json({ error: "Error interno del servidor" });
//   }
// };
// credito.controller.js - Modificar la función obtenerCreditos
const obtenerCreditos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*, 
        s.cliente_id,
        cl.nombre_cliente,
        cl.app_cliente,
        cl.apm_cliente,
        a.nom_aliado,
        a.tasa_fija
      FROM credito c
      LEFT JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      LEFT JOIN cliente cl ON cl.id_cliente = s.cliente_id
      LEFT JOIN aliado a ON a.id_aliado = c.aliado_id
      ORDER BY c.id_credito DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error al obtener créditos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// -------------------------------------------
// Obtener créditos por cliente
// -------------------------------------------
const obtenerCreditoPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const result = await pool.query(
      `
      SELECT c.*
      FROM credito c
      INNER JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      WHERE s.cliente_id = $1
      `,
      [cliente_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "El cliente no tiene créditos registrados" });
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al obtener créditos por cliente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};


module.exports = {
  guardarCredito,
  editarCredito,
  eliminarCredito,
  obtenerCreditos,
  obtenerCreditoPorCliente,
  actualizarEstadoCredito
};
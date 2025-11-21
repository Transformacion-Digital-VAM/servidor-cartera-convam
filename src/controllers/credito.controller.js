const pool = require('../config/db');

// -------------------------------------------
// Crear crédito
// -------------------------------------------
const guardarCredito = async (req, res) => {
  try {
    const {
      solicitud_id,
      responsable,
      fecha_ministracion,
      fecha_primer_pago,
      referencia_bancaria,
      tipo_credito,
      cuenta_bancaria,
      total_capital,
      total_interes,
      total_seguro,
      total_a_pagar,
      cat_porcentaje,
      tipo_servicio = "Prestamo personal"
    } = req.body;

    // Validación 
    if (!solicitud_id || !total_capital) {
      return res.status(400).json({
        error: "Solicitud ID y total_capital son obligatorios"
      });
    }

    // 1️. Insertar crédito
    const creditoResult = await pool.query(
      `INSERT INTO credito (
        solicitud_id, responsable, fecha_ministracion, fecha_primer_pago,
        referencia_bancaria, tipo_credito, cuenta_bancaria,
        total_capital, total_interes, total_seguro, total_a_pagar,
        cat_porcentaje, tipo_servicio
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        solicitud_id, responsable, fecha_ministracion, fecha_primer_pago,
        referencia_bancaria, tipo_credito, cuenta_bancaria,
        total_capital, total_interes, total_seguro, total_a_pagar,
        cat_porcentaje, tipo_servicio
      ]
    );

    const credito = creditoResult.rows[0];

    // 2️. Calcular garantía (10% del total capital)
    const montoGarantia = Number(total_capital) * 0.10;

    // 3️. Insertar garantía automáticamente
    const garantiaResult = await pool.query(
      `INSERT INTO garantia (credito_id, monto_garantia)
       VALUES ($1, $2)
       RETURNING *`,
      [credito.id_credito, montoGarantia]
    );

    res.json({
      message: "Crédito y garantía generados correctamente",
      credito,
      garantia: garantiaResult.rows[0]
    });

  } catch (error) {
    console.error("Error al guardar crédito:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
};

// -------------------------------------------
// Editar crédito
// -------------------------------------------
const editarCredito = async (req, res) => {
  const client = await pool.connect();

  try {
    const id_credito = req.params.id;

    const {
      responsable,
      fecha_ministracion,
      fecha_primer_pago,
      referencia_bancaria,
      tipo_credito,
      cuenta_bancaria,
      total_capital,
      total_interes,
      total_seguro,
      total_a_pagar,
      cat_porcentaje
    } = req.body;

    // Recalcular garantía si cambió el capital
    const total_garantia = total_capital ? Number(total_capital) * 0.10 : null;

    const query = `
      UPDATE credito SET
        responsable = COALESCE($1, responsable),
        fecha_ministracion = COALESCE($2, fecha_ministracion),
        fecha_primer_pago = COALESCE($3, fecha_primer_pago),
        referencia_bancaria = COALESCE($4, referencia_bancaria),
        tipo_credito = COALESCE($5, tipo_credito),
        cuenta_bancaria = COALESCE($6, cuenta_bancaria),
        total_capital = COALESCE($7, total_capital),
        total_interes = COALESCE($8, total_interes),
        total_seguro = COALESCE($9, total_seguro),
        total_a_pagar = COALESCE($10, total_a_pagar),
        total_garantia = COALESCE($11, total_garantia),
        cat_porcentaje = COALESCE($12, cat_porcentaje)
      WHERE id_credito = $13
      RETURNING *;
    `;

    const values = [
      responsable,
      fecha_ministracion,
      fecha_primer_pago,
      referencia_bancaria,
      tipo_credito,
      cuenta_bancaria,
      total_capital,
      total_interes,
      total_seguro,
      total_a_pagar,
      total_garantia,
      cat_porcentaje,
      id_credito
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    res.json({
      message: "Crédito actualizado correctamente",
      credito: result.rows[0]
    });

  } catch (error) {
    console.log("Error editarCredito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// -------------------------------------------
// Eliminar crédito
// -------------------------------------------
const eliminarCredito = async (req, res) => {
  try {
    const id_credito = req.params.id;

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
  }
};

// -------------------------------------------
// Obtener todos los créditos
// -------------------------------------------
const obtenerCreditos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.cliente_id
      FROM credito c
      LEFT JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      ORDER BY c.id_credito DESC;
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// -------------------------------------------
// Obtener crédito por cliente
// -------------------------------------------
const obtenerCreditoPorCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const result = await pool.query(`
      SELECT c.*
      FROM credito c
      INNER JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      WHERE s.cliente_id = $1
    `, [cliente_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "El cliente no tiene créditos" });
    }

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  guardarCredito,
  editarCredito,
  eliminarCredito,
  obtenerCreditos,
  obtenerCreditoPorCliente
};

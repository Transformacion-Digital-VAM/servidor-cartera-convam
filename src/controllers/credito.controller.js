// const pool = require('../config/db');

// // -------------------------------------------
// // Crear crédito con cálculo automático
// // -------------------------------------------
// const guardarCredito = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const {
//       solicitud_id,
//       fecha_ministracion,
//       fecha_primer_pago,
//       referencia_bancaria,
//       tipo_credito,
//       cuenta_bancaria,
//       seguro,
//       tipo_servicio = "Préstamo personal"
//     } = req.body;

//     if (!solicitud_id) {
//       return res.status(400).json({
//         error: "solicitud_id es obligatorio"
//       });
//     }

//     // 1️ Obtener datos desde la solicitud (incluye aliado_id y monto_aprobado)
//     const solicitudResult = await client.query(
//       `SELECT monto_aprobado, aliado_id 
//        FROM solicitud 
//        WHERE id_solicitud = $1`,
//       [solicitud_id]
//     );

//     if (solicitudResult.rows.length === 0) {
//       return res.status(404).json({ error: "Solicitud no encontrada" });
//     }

//     const { monto_aprobado, aliado_id } = solicitudResult.rows[0];

//     if (!aliado_id) {
//       return res.status(400).json({
//         error: "La solicitud no tiene aliado asignado"
//       });
//     }

//     const total_capital = Number(monto_aprobado);

//     if (!total_capital || total_capital <= 0) {
//       return res.status(400).json({
//         error: "La solicitud no tiene un monto aprobado válido"
//       });
//     }

//     // 2️ Obtener tasa del aliado
//     const aliadoResult = await client.query(
//       "SELECT tasa_interes FROM aliado WHERE id_aliado = $1",
//       [aliado_id]
//     );

//     if (aliadoResult.rows.length === 0) {
//       return res.status(404).json({ error: "Aliado no encontrado" });
//     }

//     const tasa_interes = Number(aliadoResult.rows[0].tasa_interes);

//     // 3️ Calcular costos (intereses, garantía, etc.)
//     const totalInteres = (total_capital / 1000) * tasa_interes;
//     const totalGarantia = total_capital * 0.10;
//     const total_seguro = seguro === true ? 80 : null;
//     const totalAPagar = total_capital + totalInteres;

//     // 4️ Insertar crédito usando aliado_id recuperado
//     const creditoResult = await client.query(
//       `INSERT INTO credito (
//         solicitud_id, aliado_id,
//         fecha_ministracion, fecha_primer_pago,
//         referencia_bancaria, tipo_credito, cuenta_bancaria,
//         total_capital, total_interes, seguro, total_seguro,
//         total_a_pagar, total_garantia, tipo_servicio
//       )
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
//       RETURNING *`,
//       [
//         solicitud_id, aliado_id,
//         fecha_ministracion, fecha_primer_pago,
//         referencia_bancaria, tipo_credito, cuenta_bancaria,
//         total_capital, totalInteres,
//         seguro,
//         total_seguro,
//         totalAPagar,
//         totalGarantia,
//         tipo_servicio
//       ]
//     );

//     await client.query("COMMIT");

//     res.json({
//       message: "Crédito registrado correctamente",
//       credito: creditoResult.rows[0]
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error guardarCredito:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };



// // -------------------------------------------
// // Editar crédito (solo fechas)
// // -------------------------------------------
// const editarCredito = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const id_credito = req.params.id;
//     const { fecha_ministracion, fecha_primer_pago } = req.body;

//     // Validación mínima
//     if (!fecha_ministracion && !fecha_primer_pago) {
//       return res.status(400).json({
//         error: "Debes enviar al menos fecha_ministracion o fecha_primer_pago"
//       });
//     }

//     // Actualizar solo las fechas
//     const result = await client.query(
//       `
//       UPDATE credito SET
//         fecha_ministracion = COALESCE($1, fecha_ministracion),
//         fecha_primer_pago = COALESCE($2, fecha_primer_pago),
//         seguro = COALESCE($3, seguro)
//       WHERE id_credito = $4
//       RETURNING *;
//       `,
//       [
//         fecha_ministracion || null,
//         fecha_primer_pago || null,
//         seguro || null,
//         id_credito
//       ]
//     );

//     if (result.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({ error: "Crédito no encontrado" });
//     }

//     await client.query("COMMIT");

//     res.json({
//       message: "Crédito actualizado correctamente",
//       credito: result.rows[0]
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.log("Error editarCredito:", error);
//     res.status(500).json({ error: "Error interno del servidor" });
//   } finally {
//     client.release();
//   }
// };

// // -------------------------------------------
// // Eliminar crédito
// // -------------------------------------------
// const eliminarCredito = async (req, res) => {
//   try {
//     const id_credito = req.params.id;

//     await pool.query("DELETE FROM garantia WHERE credito_id = $1", [id_credito]);

//     const result = await pool.query(
//       "DELETE FROM credito WHERE id_credito = $1 RETURNING *",
//       [id_credito]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Crédito no encontrado" });
//     }

//     res.json({ message: "Crédito eliminado correctamente" });

//   } catch (error) {
//     res.status(500).json({ error: "Error interno del servidor" });
//   }
// };


// // -------------------------------------------
// // Obtener todos los créditos
// // -------------------------------------------
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


// // -------------------------------------------
// // Obtener créditos por cliente
// // -------------------------------------------
// const obtenerCreditoPorCliente = async (req, res) => {
//   try {
//     const { cliente_id } = req.params;

//     const result = await pool.query(
//       `
//       SELECT c.*
//       FROM credito c
//       INNER JOIN solicitud s ON s.id_solicitud = c.solicitud_id
//       WHERE s.cliente_id = $1
//       `,
//       [cliente_id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ mensaje: "El cliente no tiene créditos" });
//     }

//     res.json(result.rows);

//   } catch (error) {
//     res.status(500).json({ error: "Error interno del servidor" });
//   }
// };


// module.exports = {
//   guardarCredito,
//   editarCredito,
//   eliminarCredito,
//   obtenerCreditos,
//   obtenerCreditoPorCliente
// };


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
      tipo_servicio = "Préstamo personal"
    } = req.body;

    if (!solicitud_id) {
      return res.status(400).json({
        error: "solicitud_id es obligatorio"
      });
    }

    // 1. Obtener datos desde la solicitud
    const solicitudResult = await client.query(
      `SELECT monto_aprobado, aliado_id 
       FROM solicitud 
       WHERE id_solicitud = $1`,
      [solicitud_id]
    );

    if (solicitudResult.rows.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const { monto_aprobado, aliado_id } = solicitudResult.rows[0];

    if (!aliado_id) {
      return res.status(400).json({
        error: "La solicitud no tiene aliado asignado"
      });
    }

    const total_capital = Number(monto_aprobado);

    if (!total_capital || total_capital <= 0) {
      return res.status(400).json({
        error: "La solicitud no tiene un monto aprobado válido"
      });
    }

    // 2. Obtener tasa del aliado (esta será el "pago por cada mil")
    const aliadoResult = await client.query(
      "SELECT tasa_interes FROM aliado WHERE id_aliado = $1",
      [aliado_id]
    );

    if (aliadoResult.rows.length === 0) {
      return res.status(404).json({ error: "Aliado no encontrado" });
    }

    // EJEMPLO: si tasa_interes = 85 → significa 85 pesos por cada mil
    const tasa_interes = Number(aliadoResult.rows[0].tasa_interes);

    // -------------------------------------------
    // 3. Cálculo tipo TABLA
    // -------------------------------------------

    // Pago semanal = (capital/1000) * tasa_interes
    const pagoSemanal = (total_capital / 1000) * tasa_interes;

    // Total a pagar = pago semanal * 16 semanas
    const totalAPagar = pagoSemanal * 16;

    // Interés total = total pagado − capital
    const totalInteres = totalAPagar - total_capital;

    // Garantía 10%
    const totalGarantia = total_capital * 0.10;

    // Seguro
    const total_seguro = seguro === true ? 80 : null;

    // -------------------------------------------

    // 4. Insertar crédito
    const creditoResult = await client.query(
      `INSERT INTO credito (
        solicitud_id, aliado_id,
        fecha_ministracion, fecha_primer_pago,
        referencia_bancaria, tipo_credito, cuenta_bancaria,
        total_capital, total_interes, pago_semanal,
        seguro, total_seguro, total_a_pagar,
        total_garantia, tipo_servicio
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        solicitud_id, aliado_id,
        fecha_ministracion, fecha_primer_pago,
        referencia_bancaria, tipo_credito, cuenta_bancaria,
        total_capital, totalInteres, pagoSemanal,
        seguro, total_seguro, totalAPagar,
        totalGarantia, tipo_servicio
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
// Editar crédito (solo fechas)
// -------------------------------------------
const editarCredito = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const id_credito = req.params.id;
    const { fecha_ministracion, fecha_primer_pago, seguro } = req.body;

    if (!fecha_ministracion && !fecha_primer_pago) {
      return res.status(400).json({
        error: "Debes enviar al menos fecha_ministracion o fecha_primer_pago"
      });
    }

    const result = await client.query(
      `
      UPDATE credito SET
        fecha_ministracion = COALESCE($1, fecha_ministracion),
        fecha_primer_pago = COALESCE($2, fecha_primer_pago),
        seguro = COALESCE($3, seguro)
      WHERE id_credito = $4
      RETURNING *;
      `,
      [
        fecha_ministracion || null,
        fecha_primer_pago || null,
        seguro || null,
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
      ORDER BY c.id_credito DESC
    `);

    res.json(result.rows);

  } catch (error) {
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

const pool = require('../config/db');

/** SOLICITUD*/
// Guardar solo solicitud
const guardarSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      usuario_id, cliente_id, aliado_id, aval_id,
      monto_solicitado, plazo_meses, no_pagos,
      tipo_vencimiento, tipo_credito,
      observaciones, dia_pago
    } = req.body;

    const clienteExistente = await client.query(
      'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
      [cliente_id]
    );

    if (clienteExistente.rows.length === 0) {
      return res.status(400).json({
        error: 'Cliente no encontrado',
        message: 'El cliente especificado no existe'
      });
    }

    const solicitudQuery = `
      INSERT INTO solicitud (
        usuario_id,
        cliente_id,
        aliado_id,
        monto_solicitado,
        plazo_meses,
        no_pagos,
        tipo_vencimiento,
        aval_id,
        tipo_credito,
        estado,
        observaciones,
        dia_pago,
        fecha_creacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id_solicitud
    `;

    const solicitudResult = await client.query(solicitudQuery, [
      usuario_id,
      cliente_id,
      aliado_id,
      monto_solicitado,      
      plazo_meses || 4,      
      no_pagos || 16,        
      tipo_vencimiento,
      aval_id,
      tipo_credito,
      'PENDIENTE',
      observaciones || '',
      dia_pago
    ]);

    res.status(201).json({
      message: 'Solicitud guardada exitosamente',
      id_solicitud: solicitudResult.rows[0].id_solicitud
    });

  } catch (error) {
    console.error('Error al guardar solicitud:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// Obtener solicitudes
const obtenerSolicitudes = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        s.id_solicitud,
        s.fecha_creacion,
        s.monto_solicitado,
        s.aliado_id,
        s.aval_id,
        s.plazo_meses,
        s.no_pagos,
        s.tipo_vencimiento,
        s.tipo_credito,
        s.estado,
        s.observaciones,
        s.dia_pago,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        u.nombre AS usuario_nombre
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      JOIN usuario u ON s.usuario_id = u.id_usuario
      ORDER BY s.id_solicitud DESC
    `;

    const result = await client.query(query);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

const obtenerSolicitudesPorCliente = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      WHERE s.cliente_id = $1
      ORDER BY s.fecha_creacion DESC
    `;

    const result = await client.query(query, [cliente_id]);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al obtener solicitudes del cliente:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// obetenr  solicitud por id
const obtenerSolicitudPorId = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      WHERE s.id_solicitud = $1
    `;

    const result = await client.query(query, [id_solicitud]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Solicitud no encontrada"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error al obtener solicitud:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// Obtener solicitud por estado
const obtenerSolicitudesPorEstado = async (req, res) => {
  const client = await pool.connect();

  try {
    const { estado } = req.params; // PENDIENTE, APROBADO o RECHAZADO

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      WHERE s.estado = $1::estado_solicitud_enum
      ORDER BY s.fecha_creacion DESC
    `;

    const result = await client.query(query, [estado.toUpperCase()]);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al obtener solicitudes por estado:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// -------------------------------------------------------------
// APROBAR SOLICITUD
// -------------------------------------------------------------
const aprobarSolicitud = async (req, res) => {
  const { id_solicitud } = req.params;
  const { monto_aprobado } = req.body;

  try {
    // 1. Validar que la solicitud existe
    const solicitud = await pool.query(`
      SELECT monto_solicitado, estado
      FROM solicitud
      WHERE id_solicitud = $1
    `, [id_solicitud]);

    if (solicitud.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const { monto_solicitado, estado } = solicitud.rows[0];

    // 2. Validar que la solicitud esté pendiente
    if (estado !== 'PENDIENTE') {
      return res.status(400).json({
        error: 'La solicitud no puede ser aprobada',
        detalle: `Estado actual: ${estado}`
      });
    }

    // 3. Validar monto aprobado
    if (!monto_aprobado || monto_aprobado <= 0) {
      return res.status(400).json({
        error: 'El monto aprobado es inválido'
      });
    }

    if (Number(monto_aprobado) > Number(monto_solicitado)) {
      return res.status(400).json({
        error: 'El monto aprobado no puede ser mayor al monto solicitado'
      });
    }

    // 4. Actualizar solicitud
    const result = await pool.query(`
      UPDATE solicitud
      SET estado = 'APROBADO',
          monto_aprobado = $1,
          fecha_aprobacion = NOW()
      WHERE id_solicitud = $2
      RETURNING *
    `, [monto_aprobado, id_solicitud]);

    res.json({
      message: 'Solicitud aprobada correctamente',
      solicitud: result.rows[0]
    });

  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ 
      error: "Error al aprobar solicitud", 
      detalle: error.message 
    });
  }
};


// -------------------------------------------------------------
// RECHAZAR SOLICITUD
// -------------------------------------------------------------
const rechazarSolicitud = async (req, res) => {
  const { id_solicitud } = req.params;
  const { motivo } = req.body;

  try {
    const result = await pool.query(`
      UPDATE solicitud
      SET estado = 'RECHAZADO',
          observaciones = $1,
          fecha_aprobacion = NOW()
      WHERE id_solicitud = $2
      RETURNING *
    `, [motivo || 'Sin motivo especificado', id_solicitud]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      message: 'Solicitud rechazada correctamente',
      solicitud: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: "Error al rechazar solicitud", detalle: error.message });
  }
};



// Obtener solicitud por cliente
const guardarGarantia = async (req, res) => {
  const { id_solicitud } = req.params;

  try {
    // 1. Obtener la solicitud aprobada
    const solicitudResult = await pool.query(
      `SELECT id_solicitud, monto_aprobado, estado 
       FROM solicitud 
       WHERE id_solicitud = $1`,
      [id_solicitud]
    );

    if (solicitudResult.rows.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const solicitud = solicitudResult.rows[0];

    // 2. Verificar que esté aprobada
    if (solicitud.estado !== "APROBADO") {
      return res.status(400).json({
        error: "La solicitud no está aprobada. No se puede generar garantía."
      });
    }

    // 3. Verificar que tenga monto aprobado
    const montoAprobado = Number(solicitud.monto_aprobado);

    if (isNaN(montoAprobado) || montoAprobado <= 0) {
      return res.status(400).json({
        error: "La solicitud no tiene un monto aprobado válido."
      });
    }

    // 4. Calcular garantía (10%)
    const montoGarantia = montoAprobado * 0.10;

    // 5. Insertar garantía en tabla garantia
    const garantiaResult = await pool.query(
      `INSERT INTO garantia (credito_id, monto_garantia)
       VALUES ($1, $2)
       RETURNING *`,
      [id_solicitud, montoGarantia]
    );

    res.json({
      message: "Garantía generada correctamente",
      garantia: garantiaResult.rows[0]
    });

  } catch (error) {
    console.error("Error al generar garantía:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
};

// -------------------------------------------------------------
// ELIMINAR SOLICITUD
// -------------------------------------------------------------
const eliminarSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;

    await client.query("BEGIN");

    // 1. Verificar que la solicitud existe
    const solicitud = await client.query(
      `SELECT id_solicitud, aval_id 
       FROM solicitud 
       WHERE id_solicitud = $1`,
      [id_solicitud]
    );

    if (solicitud.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const { aval_id } = solicitud.rows[0];

    // 2. Verificar si la solicitud tiene crédito asociado
    const credito = await client.query(
      `SELECT id_credito FROM credito WHERE solicitud_id = $1`,
      [id_solicitud]
    );

    if (credito.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "No se puede eliminar la solicitud",
        detalle: "La solicitud ya tiene un crédito asociado"
      });
    }

    // 3. Eliminar solicitud
    await client.query(
      `DELETE FROM solicitud WHERE id_solicitud = $1`,
      [id_solicitud]
    );

    // 4. Verificar si el aval está asociado a otras solicitudes
    if (aval_id) {
      const avalUso = await client.query(
        `SELECT COUNT(*) AS total 
         FROM solicitud 
         WHERE aval_id = $1`,
        [aval_id]
      );

      if (Number(avalUso.rows[0].total) === 0) {
        // 5. Eliminar aval
        await client.query(
          `DELETE FROM aval WHERE id_aval = $1`,
          [aval_id]
        );
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Solicitud eliminada correctamente",
      aval_eliminado: aval_id ? "Se eliminó si no tenía más uso" : "No tenía aval"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar solicitud:", error);
    res.status(500).json({
      error: "Error al eliminar solicitud",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  guardarSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudesPorCliente,
  obtenerSolicitudPorId,
  obtenerSolicitudesPorEstado,
  aprobarSolicitud,
  rechazarSolicitud,
  guardarGarantia,
  eliminarSolicitud
};

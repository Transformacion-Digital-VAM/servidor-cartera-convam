// // controllers/solicitud.controller.js
// const pool = require('../config/db');

// /** SOLICITUD - FUNCIONES EXISTENTES (actualizadas) */
// const guardarSolicitud = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const {
//       usuario_id, cliente_id, aliado_id, aval_id,
//       monto_solicitado, plazo_meses, no_pagos,
//       tipo_vencimiento, tipo_credito,
//       observaciones, dia_pago
//     } = req.body;

//     const clienteExistente = await client.query(
//       'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
//       [cliente_id]
//     );

//     if (clienteExistente.rows.length === 0) {
//       return res.status(400).json({
//         error: 'Cliente no encontrado',
//         message: 'El cliente especificado no existe'
//       });
//     }

//     const solicitudQuery = `
//       INSERT INTO solicitud (
//         usuario_id,
//         cliente_id,
//         aliado_id,
//         monto_solicitado,
//         plazo_meses,
//         no_pagos,
//         tipo_vencimiento,
//         aval_id,
//         tipo_credito,
//         estado,
//         observaciones,
//         dia_pago,
//         fecha_creacion,
//         domiciliado,
//         coordinador_id
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), false, NULL)
//       RETURNING id_solicitud
//     `;

//     const solicitudResult = await client.query(solicitudQuery, [
//       usuario_id,
//       cliente_id,
//       aliado_id,
//       monto_solicitado,
//       plazo_meses || 4,
//       no_pagos || 16,
//       tipo_vencimiento,
//       aval_id,
//       tipo_credito,
//       'PENDIENTE',
//       observaciones || '',
//       dia_pago
//     ]);

//     res.status(201).json({
//       message: 'Solicitud guardada exitosamente',
//       id_solicitud: solicitudResult.rows[0].id_solicitud
//     });

//   } catch (error) {
//     console.error('Error al guardar solicitud:', error);
//     res.status(500).json({
//       error: 'Error interno del servidor',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // Obtener solicitudes (actualizado)
// const obtenerSolicitudes = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const query = `
// SELECT 
//     s.*,
//     c.nombre_cliente,
//     c.app_cliente,
//     c.apm_cliente,

//     u.nombre AS usuario_nombre,
//     uc.nombre AS coordinador_nombre,

//     -- Dirección del cliente
//     d.localidad AS cliente_localidad,
//     d.calle     AS cliente_calle,
//     d.numero    AS cliente_numero,

//     al.nom_aliado,

//     -- Datos del aval
//     a.nombre_aval,
//     a.app_aval,
//     a.apm_aval,

//     -- Dirección del aval
//     da.localidad AS aval_localidad,
//     da.calle     AS aval_calle,
//     da.numero    AS aval_numero

//       FROM solicitud s
//       JOIN cliente c 
//           ON s.cliente_id = c.id_cliente

//       JOIN usuario u 
//           ON s.usuario_id = u.id_usuario

//       JOIN direccion d 
//           ON c.direccion_id = d.id_direccion

//       JOIN aliado al 
//           ON s.aliado_id = al.id_aliado

//       JOIN aval a 
//           ON s.aval_id = a.id_aval

//       LEFT JOIN direccion da 
//           ON a.direccion_id = da.id_direccion

//       LEFT JOIN usuario uc 
//           ON s.coordinador_id = uc.id_usuario

//       ORDER BY s.id_solicitud DESC;

//     `;

//     const result = await client.query(query);
//     res.status(200).json(result.rows);

//   } catch (error) {
//     console.error("Error al obtener solicitudes:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // APROBAR SOLICITUD (Tesorería)
// const aprobarSolicitud = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;
//     const { monto_aprobado } = req.body;

//     await client.query("BEGIN");

//     // Validar que la solicitud existe
//     const solicitud = await client.query(`
//       SELECT monto_solicitado, estado
//       FROM solicitud
//       WHERE id_solicitud = $1
//     `, [id_solicitud]);

//     if (solicitud.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({ error: 'Solicitud no encontrada' });
//     }

//     const { monto_solicitado, estado } = solicitud.rows[0];

//     // Validar estado
//     if (estado !== 'PENDIENTE') {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         error: 'La solicitud no puede ser aprobada',
//         detalle: `Estado actual: ${estado}`
//       });
//     }

//     // Validar monto
//     if (!monto_aprobado || monto_aprobado <= 0) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         error: 'El monto aprobado es inválido'
//       });
//     }

//     if (Number(monto_aprobado) > Number(monto_solicitado)) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         error: 'El monto aprobado no puede ser mayor al monto solicitado'
//       });
//     }

//     // Actualizar solicitud
//     const result = await client.query(`
//       UPDATE solicitud
//       SET estado = 'APROBADO',
//           monto_aprobado = $1,
//           fecha_aprobacion = NOW()
//       WHERE id_solicitud = $2
//       RETURNING *
//     `, [monto_aprobado, id_solicitud]);

//     await client.query("COMMIT");

//     res.json({
//       message: 'Solicitud aprobada correctamente',
//       solicitud: result.rows[0]
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error('Error al aprobar solicitud:', error);
//     res.status(500).json({
//       error: "Error al aprobar solicitud",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // RECHAZAR SOLICITUD
// const rechazarSolicitud = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;
//     const { motivo } = req.body;

//     await client.query("BEGIN");

//     const result = await client.query(`
//       UPDATE solicitud
//       SET estado = 'RECHAZADO',
//           observaciones = COALESCE(observaciones || ' ' || $1, $1),
//           fecha_aprobacion = NOW()
//       WHERE id_solicitud = $2
//       RETURNING *
//     `, [motivo || 'Sin motivo especificado', id_solicitud]);

//     if (result.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({ error: 'Solicitud no encontrada' });
//     }

//     await client.query("COMMIT");

//     res.json({
//       message: 'Solicitud rechazada correctamente',
//       solicitud: result.rows[0]
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     res.status(500).json({ error: "Error al rechazar solicitud", detalle: error.message });
//   } finally {
//     client.release();
//   }
// };

// /** NUEVAS FUNCIONES PARA DOMICILIACIÓN */

// // REGISTRAR DOMICILIACIÓN
// // En solicitud.controller.js - función registrarDomiciliacion
// const registrarDomiciliacion = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;
//     const {
//       horario,
//       persona_recibio,
//       fecha_domiciliacion
//     } = req.body;

//     // Obtener el usuario del middleware de Firebase
//     const coordinador_id = req.user.id_usuario; // ← Esto viene del middleware

//     await client.query("BEGIN");

//     // 1. Verificar que el usuario es coordinador
//     const usuarioQuery = await client.query(`
//       SELECT u.id_usuario, r.nombre_rol, r.id_rol 
//       FROM usuario u 
//       JOIN rol r ON u.rol_id = r.id_rol 
//       WHERE u.id_usuario = $1
//     `, [coordinador_id]);

//     if (usuarioQuery.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({
//         success: false,
//         error: 'Usuario no encontrado',
//         detalle: 'El usuario no existe en la base de datos'
//       });
//     }

//     const usuarioRol = usuarioQuery.rows[0].nombre_rol;

//     // Verificar que sea coordinador
//     if (usuarioRol !== 'coordinador' && usuarioRol !== 'administrador') {
//       await client.query("ROLLBACK");
//       return res.status(403).json({
//         success: false,
//         error: 'Acceso denegado',
//         detalle: `Solo coordinadores pueden registrar domiciliaciones. Tu rol: ${usuarioRol}`
//       });
      
//     }

//     // 2. Verificar que la solicitud existe y está aprobada
//     const solicitudQuery = await client.query(`
//       SELECT estado, domiciliado 
//       FROM solicitud 
//       WHERE id_solicitud = $1
//     `, [id_solicitud]);

//     if (solicitudQuery.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({
//         success: false,
//         error: 'Solicitud no encontrada'
//       });
//     }

//     const { estado, domiciliado } = solicitudQuery.rows[0];


//     if (domiciliado) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         success: false,
//         error: 'Solicitud ya domiciliada',
//         detalle: 'Esta solicitud ya fue domiciliada anteriormente'
//       });
//     }

//     // 3. Validar campos requeridos
//     if (!horario || !persona_recibio) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         success: false,
//         error: 'Campos requeridos faltantes',
//         detalle: 'Se requieren: horario y persona_recibio'
//       });
//     }

//     // 4. Registrar domiciliación
//     const result = await client.query(`
//       UPDATE solicitud 
//       SET domiciliado = true,
//           coordinador_id = $1,
//           domiciliacion_horario = $2,
//           persona_recibio = $3,
//           fecha_domiciliacion = $4
//       WHERE id_solicitud = $5
//       RETURNING *
//     `, [coordinador_id, horario, persona_recibio, fecha_domiciliacion, id_solicitud]);

//     await client.query("COMMIT");

//     res.json({
//       success: true,
//       message: 'Domiciliación registrada exitosamente',
//       data: result.rows[0],
//       coordinador: {
//         id: coordinador_id,
//         nombre: req.user.nombre
//       }
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error('Error al registrar domiciliación:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error al registrar domiciliación',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };
// // OBTENER SOLICITUDES PENDIENTES DE DOMICILIACIÓN
// const obtenerSolicitudesPendientesDomiciliacion = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const query = `
//       SELECT 
//         s.id_solicitud,
//         s.fecha_creacion,
//         s.fecha_aprobacion,
//         s.monto_aprobado,
//         s.tipo_credito,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         c.telefono,
//         d.municipio,
//         d.localidad,
//         d.calle,
//         d.numero,
//         a.nom_aliado,
//         u.nombre as creado_por,
//         EXTRACT(DAY FROM NOW() - s.fecha_aprobacion) as dias_pendiente
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       JOIN usuario u ON s.usuario_id = u.id_usuario
//       JOIN aliado a ON s.aliado_id = a.id_aliado
//       JOIN direccion d ON c.direccion_id = d.id_direccion
//       WHERE s.estado = 'PENDIENTE'
//       AND s.domiciliado = false
//       ORDER BY s.fecha_aprobacion ASC
//     `;

//     const result = await client.query(query);

//     res.json({
//       success: true,
//       data: result.rows,
//       total: result.rows.length
//     });

//   } catch (error) {
//     console.error('Error al obtener pendientes de domiciliación:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error interno del servidor',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // OBTENER SOLICITUDES DOMICILIADAS
// const obtenerSolicitudesDomiciliadas = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { coordinador_id, fecha_inicio, fecha_fin } = req.query;

//     let query = `
//       SELECT 
//         s.*,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         u.nombre as coordinador_nombre,
//         uc.nombre as creado_por,
//         a.nom_aliado,
//         d.municipio
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       JOIN usuario u ON s.coordinador_id = u.id_usuario
//       JOIN usuario uc ON s.usuario_id = uc.id_usuario
//       JOIN aliado a ON s.aliado_id = a.id_aliado
//       JOIN direccion d ON c.direccion_id = d.id_direccion
//       WHERE s.domiciliado = true
//     `;

//     const params = [];
//     let paramCount = 1;

//     if (coordinador_id) {
//       query += ` AND s.coordinador_id = $${paramCount}`;
//       params.push(coordinador_id);
//       paramCount++;
//     }

//     if (fecha_inicio) {
//       query += ` AND s.fecha_domiciliacion >= $${paramCount}`;
//       params.push(fecha_inicio);
//       paramCount++;
//     }

//     if (fecha_fin) {
//       query += ` AND s.fecha_domiciliacion <= $${paramCount}`;
//       params.push(fecha_fin);
//       paramCount++;
//     }

//     query += ` ORDER BY s.fecha_domiciliacion DESC`;

//     const result = await client.query(query, params);

//     res.json({
//       success: true,
//       data: result.rows,
//       total: result.rows.length
//     });

//   } catch (error) {
//     console.error('Error al obtener domiciliadas:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error interno del servidor',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // VERIFICAR ESTADO DE SOLICITUD (para crear crédito)
// const verificarEstadoSolicitud = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;

//     const query = `
//       SELECT 
//         s.*,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         -- Verificar si está lista para crédito
//         (s.estado = 'APROBADO' AND s.domiciliado = true) as puede_crear_credito,
//         -- Mensaje de estado
//         CASE 
//           WHEN s.estado != 'APROBADO' THEN 'Pendiente de aprobación por tesorería'
//           WHEN s.domiciliado = false THEN 'Pendiente de domiciliación por coordinador'
//           ELSE 'Lista para crear crédito'
//         END as mensaje_estado,
//         -- Verificar si ya tiene crédito
//         EXISTS(SELECT 1 FROM credito cr WHERE cr.solicitud_id = s.id_solicitud) as tiene_credito
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       WHERE s.id_solicitud = $1
//     `;

//     const result = await client.query(query, [id_solicitud]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Solicitud no encontrada'
//       });
//     }

//     const solicitud = result.rows[0];

//     res.json({
//       success: true,
//       data: solicitud,
//       puede_crear_credito: solicitud.puede_crear_credito,
//       mensaje: solicitud.mensaje_estado,
//       tiene_credito: solicitud.tiene_credito
//     });

//   } catch (error) {
//     console.error('Error al verificar estado:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error interno del servidor',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// // ESTADÍSTICAS DE DOMICILIACIÓN
// const obtenerEstadisticasDomiciliacion = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { fecha_inicio, fecha_fin } = req.query;

//     const query = `
//       SELECT 
//         -- Totales
//         COUNT(*) as total_solicitudes,
//         COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
//         COUNT(CASE WHEN domiciliado = true THEN 1 END) as domiciliadas,
//         COUNT(CASE WHEN estado = 'APROBADO' AND domiciliado = true THEN 1 END) as listas_credito,
        
//         -- Por coordinador
//         u.nombre as coordinador_nombre,
//         u.usuario as coordinador_usuario,
//         COUNT(s.id_solicitud) as total_asignadas,
//         COUNT(CASE WHEN s.domiciliado = true THEN 1 END) as completadas,
//         ROUND(
//           COUNT(CASE WHEN s.domiciliado = true THEN 1 END) * 100.0 / 
//           NULLIF(COUNT(s.id_solicitud), 0), 
//           2
//         ) as porcentaje_completado
//       FROM solicitud s
//       JOIN usuario u ON s.coordinador_id = u.id_usuario
//       WHERE s.estado = 'APROBADO'
//     `;

//     const params = [];
//     let paramCount = 1;

//     if (fecha_inicio) {
//       query += ` AND s.fecha_aprobacion >= $${paramCount}`;
//       params.push(fecha_inicio);
//       paramCount++;
//     }

//     if (fecha_fin) {
//       query += ` AND s.fecha_aprobacion <= $${paramCount}`;
//       params.push(fecha_fin);
//       paramCount++;
//     }

//     query += `
//       GROUP BY u.id_usuario, u.nombre, u.usuario
//       ORDER BY completadas DESC;
//     `;

//     const result = await client.query(query, params);

//     res.json({
//       success: true,
//       data: result.rows
//     });

//   } catch (error) {
//     console.error('Error al obtener estadísticas:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error interno del servidor',
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// /** FUNCIONES EXISTENTES (sin cambios) */
// const obtenerSolicitudesPorCliente = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { cliente_id } = req.params;

//     const query = `
//       SELECT 
//         s.*,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         uc.nombre as coordinador_nombre
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       LEFT JOIN usuario uc ON s.coordinador_id = uc.id_usuario
//       WHERE s.cliente_id = $1
//       ORDER BY s.fecha_creacion DESC
//     `;

//     const result = await client.query(query, [cliente_id]);

//     res.status(200).json(result.rows);

//   } catch (error) {
//     console.error("Error al obtener solicitudes del cliente:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// const obtenerSolicitudPorId = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;

//     const query = `
//       SELECT 
//         s.*,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         u.nombre as coordinador_nombre,
//         uc.nombre as creado_por_nombre
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       LEFT JOIN usuario u ON s.coordinador_id = u.id_usuario
//       JOIN usuario uc ON s.usuario_id = uc.id_usuario
//       WHERE s.id_solicitud = $1
//     `;

//     const result = await client.query(query, [id_solicitud]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         error: "Solicitud no encontrada"
//       });
//     }

//     res.status(200).json(result.rows[0]);

//   } catch (error) {
//     console.error("Error al obtener solicitud:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// const obtenerSolicitudesPorEstado = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { estado } = req.params;

//     const query = `
//       SELECT 
//         s.*,
//         c.nombre_cliente,
//         c.app_cliente,
//         c.apm_cliente,
//         u.nombre as coordinador_nombre
//       FROM solicitud s
//       JOIN cliente c ON s.cliente_id = c.id_cliente
//       LEFT JOIN usuario u ON s.coordinador_id = u.id_usuario
//       WHERE s.estado = $1::estado_solicitud_enum
//       ORDER BY s.fecha_creacion DESC
//     `;

//     const result = await client.query(query, [estado.toUpperCase()]);

//     res.status(200).json(result.rows);

//   } catch (error) {
//     console.error("Error al obtener solicitudes por estado:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// const guardarGarantia = async (req, res) => {
//   const { id_solicitud } = req.params;

//   try {
//     // Tu código existente aquí
//     const solicitudResult = await pool.query(
//       `SELECT id_solicitud, monto_aprobado, estado 
//        FROM solicitud 
//        WHERE id_solicitud = $1`,
//       [id_solicitud]
//     );

//     if (solicitudResult.rows.length === 0) {
//       return res.status(404).json({ error: "Solicitud no encontrada" });
//     }

//     const solicitud = solicitudResult.rows[0];

//     if (solicitud.estado !== "APROBADO") {
//       return res.status(400).json({
//         error: "La solicitud no está aprobada. No se puede generar garantía."
//       });
//     }

//     const montoAprobado = Number(solicitud.monto_aprobado);

//     if (isNaN(montoAprobado) || montoAprobado <= 0) {
//       return res.status(400).json({
//         error: "La solicitud no tiene un monto aprobado válido."
//       });
//     }

//     const montoGarantia = montoAprobado * 0.10;

//     const garantiaResult = await pool.query(
//       `INSERT INTO garantia (credito_id, monto_garantia)
//        VALUES ($1, $2)
//        RETURNING *`,
//       [id_solicitud, montoGarantia]
//     );

//     res.json({
//       message: "Garantía generada correctamente",
//       garantia: garantiaResult.rows[0]
//     });

//   } catch (error) {
//     console.error("Error al generar garantía:", error);
//     res.status(500).json({
//       error: "Error interno del servidor",
//       detalle: error.message
//     });
//   }
// };

// const eliminarSolicitud = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { id_solicitud } = req.params;

//     await client.query("BEGIN");

//     const solicitud = await client.query(
//       `SELECT id_solicitud, aval_id, estado, domiciliado
//        FROM solicitud 
//        WHERE id_solicitud = $1`,
//       [id_solicitud]
//     );

//     if (solicitud.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({ error: "Solicitud no encontrada" });
//     }

//     const { aval_id, estado, domiciliado } = solicitud.rows[0];

//     if (estado === 'APROBADO' || domiciliado) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         error: "No se puede eliminar la solicitud",
//         detalle: `La solicitud tiene estado: ${estado} ${domiciliado ? '(domiciliada)' : ''}`
//       });
//     }

//     const credito = await client.query(
//       `SELECT id_credito FROM credito WHERE solicitud_id = $1`,
//       [id_solicitud]
//     );

//     if (credito.rows.length > 0) {
//       await client.query("ROLLBACK");
//       return res.status(400).json({
//         error: "No se puede eliminar la solicitud",
//         detalle: "La solicitud ya tiene un crédito asociado"
//       });
//     }

//     await client.query(
//       `DELETE FROM solicitud WHERE id_solicitud = $1`,
//       [id_solicitud]
//     );

//     if (aval_id) {
//       const avalUso = await client.query(
//         `SELECT COUNT(*) AS total 
//          FROM solicitud 
//          WHERE aval_id = $1`,
//         [aval_id]
//       );

//       if (Number(avalUso.rows[0].total) === 0) {
//         await client.query(
//           `DELETE FROM aval WHERE id_aval = $1`,
//           [aval_id]
//         );
//       }
//     }

//     await client.query("COMMIT");

//     res.status(200).json({
//       message: "Solicitud eliminada correctamente",
//       aval_eliminado: aval_id ? "Se eliminó si no tenía más uso" : "No tenía aval"
//     });

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error al eliminar solicitud:", error);
//     res.status(500).json({
//       error: "Error al eliminar solicitud",
//       detalle: error.message
//     });
//   } finally {
//     client.release();
//   }
// };

// module.exports = {
//   guardarSolicitud,
//   obtenerSolicitudes,
//   obtenerSolicitudesPorCliente,
//   obtenerSolicitudPorId,
//   obtenerSolicitudesPorEstado,
//   aprobarSolicitud,
//   rechazarSolicitud,
//   guardarGarantia,
//   eliminarSolicitud,
//   // Nuevas funciones
//   registrarDomiciliacion,
//   obtenerSolicitudesPendientesDomiciliacion,
//   obtenerSolicitudesDomiciliadas,
//   verificarEstadoSolicitud,
//   obtenerEstadisticasDomiciliacion
// };



// controllers/solicitud.controller.js
const pool = require('../config/db');

/** SOLICITUD - FUNCIONES EXISTENTES (actualizadas) */
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
        fecha_creacion,
        domiciliado,
        coordinador_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), false, NULL)
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

// Obtener solicitudes (actualizado)
const obtenerSolicitudes = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
SELECT 
    s.*,
    c.nombre_cliente,
    c.app_cliente,
    c.apm_cliente,

    u.nombre AS usuario_nombre,
    uc.nombre AS coordinador_nombre,

    -- Dirección del cliente
    d.localidad AS cliente_localidad,
    d.calle     AS cliente_calle,
    d.numero    AS cliente_numero,

    al.nom_aliado,

    -- Datos del aval
    a.nombre_aval,
    a.app_aval,
    a.apm_aval,

    -- Dirección del aval
    da.localidad AS aval_localidad,
    da.calle     AS aval_calle,
    da.numero    AS aval_numero

      FROM solicitud s
      JOIN cliente c 
          ON s.cliente_id = c.id_cliente

      JOIN usuario u 
          ON s.usuario_id = u.id_usuario

      JOIN direccion d 
          ON c.direccion_id = d.id_direccion

      JOIN aliado al 
          ON s.aliado_id = al.id_aliado

      JOIN aval a 
          ON s.aval_id = a.id_aval

      LEFT JOIN direccion da 
          ON a.direccion_id = da.id_direccion

      LEFT JOIN usuario uc 
          ON s.coordinador_id = uc.id_usuario

      ORDER BY s.id_solicitud DESC;

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

// APROBAR SOLICITUD (Tesorería)
const aprobarSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;
    const { monto_aprobado } = req.body;

    await client.query("BEGIN");

    // Validar que la solicitud existe
    const solicitud = await client.query(`
      SELECT monto_solicitado, estado
      FROM solicitud
      WHERE id_solicitud = $1
    `, [id_solicitud]);

    if (solicitud.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const { monto_solicitado, estado } = solicitud.rows[0];

    // Validar estado
    if (estado !== 'PENDIENTE') {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: 'La solicitud no puede ser aprobada',
        detalle: `Estado actual: ${estado}`
      });
    }

    // Validar monto
    if (!monto_aprobado || monto_aprobado <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: 'El monto aprobado es inválido'
      });
    }

    if (Number(monto_aprobado) > Number(monto_solicitado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: 'El monto aprobado no puede ser mayor al monto solicitado'
      });
    }

    // Actualizar solicitud
    const result = await client.query(`
      UPDATE solicitud
      SET estado = 'APROBADO',
          monto_aprobado = $1,
          fecha_aprobacion = NOW()
      WHERE id_solicitud = $2
      RETURNING *
    `, [monto_aprobado, id_solicitud]);

    await client.query("COMMIT");

    res.json({
      message: 'Solicitud aprobada correctamente',
      solicitud: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({
      error: "Error al aprobar solicitud",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// RECHAZAR SOLICITUD
const rechazarSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;
    const { motivo } = req.body;

    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE solicitud
      SET estado = 'RECHAZADO',
          observaciones = COALESCE(observaciones || ' ' || $1, $1),
          fecha_aprobacion = NOW()
      WHERE id_solicitud = $2
      RETURNING *
    `, [motivo || 'Sin motivo especificado', id_solicitud]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    await client.query("COMMIT");

    res.json({
      message: 'Solicitud rechazada correctamente',
      solicitud: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error al rechazar solicitud", detalle: error.message });
  } finally {
    client.release();
  }
};

/** NUEVAS FUNCIONES PARA DOMICILIACIÓN */

// REGISTRAR DOMICILIACIÓN
// En solicitud.controller.js - función registrarDomiciliacion
const registrarDomiciliacion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;
    const {
      horario,
      persona_recibio,
      fecha_domiciliacion
    } = req.body;

    // Obtener el usuario del middleware de Firebase
    const coordinador_id = req.user.id_usuario; // ← Esto viene del middleware

    await client.query("BEGIN");

    // 1. Verificar que el usuario es coordinador
    const usuarioQuery = await client.query(`
      SELECT u.id_usuario, r.nombre_rol, r.id_rol 
      FROM usuario u 
      JOIN rol r ON u.rol_id = r.id_rol 
      WHERE u.id_usuario = $1
    `, [coordinador_id]);

    if (usuarioQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        detalle: 'El usuario no existe en la base de datos'
      });
    }

    const usuarioRol = usuarioQuery.rows[0].nombre_rol;

    // Verificar que sea coordinador
    if (usuarioRol !== 'COORDINADOR' && usuarioRol !== 'ADMIN' && usuarioQuery.rows[0].id_rol !== 3) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        detalle: `Solo coordinadores pueden registrar domiciliaciones. Tu rol: ${usuarioRol}`
      });
    }

    // 2. Verificar que la solicitud existe y está aprobada
    const solicitudQuery = await client.query(`
      SELECT estado, domiciliado 
      FROM solicitud 
      WHERE id_solicitud = $1
    `, [id_solicitud]);

    if (solicitudQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    const { estado, domiciliado } = solicitudQuery.rows[0];


    if (domiciliado) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: 'Solicitud ya domiciliada',
        detalle: 'Esta solicitud ya fue domiciliada anteriormente'
      });
    }

    // 3. Validar campos requeridos
    if (!horario || !persona_recibio) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        detalle: 'Se requieren: horario y persona_recibio'
      });
    }

    // 4. Registrar domiciliación
    const result = await client.query(`
      UPDATE solicitud 
      SET domiciliado = true,
          coordinador_id = $1,
          domiciliacion_horario = $2,
          persona_recibio = $3,
          fecha_domiciliacion = $4
      WHERE id_solicitud = $5
      RETURNING *
    `, [coordinador_id, horario, persona_recibio, fecha_domiciliacion, id_solicitud]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: 'Domiciliación registrada exitosamente',
      data: result.rows[0],
      coordinador: {
        id: coordinador_id,
        nombre: req.user.nombre
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error al registrar domiciliación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar domiciliación',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};  
// OBTENER SOLICITUDES PENDIENTES DE DOMICILIACIÓN
const obtenerSolicitudesPendientesDomiciliacion = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        s.id_solicitud,
        s.fecha_creacion,
        s.fecha_aprobacion,
        s.monto_aprobado,
        s.tipo_credito,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        c.telefono,
        d.municipio,
        d.localidad,
        d.calle,
        d.numero,
        a.nom_aliado,
        u.nombre as creado_por,
        EXTRACT(DAY FROM NOW() - s.fecha_aprobacion) as dias_pendiente
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      JOIN usuario u ON s.usuario_id = u.id_usuario
      JOIN aliado a ON s.aliado_id = a.id_aliado
      JOIN direccion d ON c.direccion_id = d.id_direccion
      WHERE s.estado = 'PENDIENTE'
      AND s.domiciliado = false
      ORDER BY s.fecha_aprobacion ASC
    `;

    const result = await client.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener pendientes de domiciliación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// OBTENER SOLICITUDES DOMICILIADAS
const obtenerSolicitudesDomiciliadas = async (req, res) => {
  const client = await pool.connect();

  try {
    const { coordinador_id, fecha_inicio, fecha_fin } = req.query;

    let query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        u.nombre as coordinador_nombre,
        uc.nombre as creado_por,
        a.nom_aliado,
        d.municipio
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      JOIN usuario u ON s.coordinador_id = u.id_usuario
      JOIN usuario uc ON s.usuario_id = uc.id_usuario
      JOIN aliado a ON s.aliado_id = a.id_aliado
      JOIN direccion d ON c.direccion_id = d.id_direccion
      WHERE s.domiciliado = true
    `;

    const params = [];
    let paramCount = 1;

    if (coordinador_id) {
      query += ` AND s.coordinador_id = $${paramCount}`;
      params.push(coordinador_id);
      paramCount++;
    }

    if (fecha_inicio) {
      query += ` AND s.fecha_domiciliacion >= $${paramCount}`;
      params.push(fecha_inicio);
      paramCount++;
    }

    if (fecha_fin) {
      query += ` AND s.fecha_domiciliacion <= $${paramCount}`;
      params.push(fecha_fin);
      paramCount++;
    }

    query += ` ORDER BY s.fecha_domiciliacion DESC`;

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener domiciliadas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// VERIFICAR ESTADO DE SOLICITUD (para crear crédito)
const verificarEstadoSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        -- Verificar si está lista para crédito
        (s.estado = 'APROBADO' AND s.domiciliado = true) as puede_crear_credito,
        -- Mensaje de estado
        CASE 
          WHEN s.estado != 'APROBADO' THEN 'Pendiente de aprobación por tesorería'
          WHEN s.domiciliado = false THEN 'Pendiente de domiciliación por coordinador'
          ELSE 'Lista para crear crédito'
        END as mensaje_estado,
        -- Verificar si ya tiene crédito
        EXISTS(SELECT 1 FROM credito cr WHERE cr.solicitud_id = s.id_solicitud) as tiene_credito
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      WHERE s.id_solicitud = $1
    `;

    const result = await client.query(query, [id_solicitud]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    const solicitud = result.rows[0];

    res.json({
      success: true,
      data: solicitud,
      puede_crear_credito: solicitud.puede_crear_credito,
      mensaje: solicitud.mensaje_estado,
      tiene_credito: solicitud.tiene_credito
    });

  } catch (error) {
    console.error('Error al verificar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

// ESTADÍSTICAS DE DOMICILIACIÓN
const obtenerEstadisticasDomiciliacion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const query = `
      SELECT 
        -- Totales
        COUNT(*) as total_solicitudes,
        COUNT(CASE WHEN estado = 'APROBADO' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN domiciliado = true THEN 1 END) as domiciliadas,
        COUNT(CASE WHEN estado = 'APROBADO' AND domiciliado = true THEN 1 END) as listas_credito,
        
        -- Por coordinador
        u.nombre as coordinador_nombre,
        u.usuario as coordinador_usuario,
        COUNT(s.id_solicitud) as total_asignadas,
        COUNT(CASE WHEN s.domiciliado = true THEN 1 END) as completadas,
        ROUND(
          COUNT(CASE WHEN s.domiciliado = true THEN 1 END) * 100.0 / 
          NULLIF(COUNT(s.id_solicitud), 0), 
          2
        ) as porcentaje_completado
      FROM solicitud s
      JOIN usuario u ON s.coordinador_id = u.id_usuario
      WHERE s.estado = 'APROBADO'
    `;

    const params = [];
    let paramCount = 1;

    if (fecha_inicio) {
      query += ` AND s.fecha_aprobacion >= $${paramCount}`;
      params.push(fecha_inicio);
      paramCount++;
    }

    if (fecha_fin) {
      query += ` AND s.fecha_aprobacion <= $${paramCount}`;
      params.push(fecha_fin);
      paramCount++;
    }

    query += `
      GROUP BY u.id_usuario, u.nombre, u.usuario
      ORDER BY completadas DESC;
    `;

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

/** FUNCIONES EXISTENTES (sin cambios) */
const obtenerSolicitudesPorCliente = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        uc.nombre as coordinador_nombre
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      LEFT JOIN usuario uc ON s.coordinador_id = uc.id_usuario
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

const obtenerSolicitudPorId = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        u.nombre as coordinador_nombre,
        uc.nombre as creado_por_nombre
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      LEFT JOIN usuario u ON s.coordinador_id = u.id_usuario
      JOIN usuario uc ON s.usuario_id = uc.id_usuario
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

const obtenerSolicitudesPorEstado = async (req, res) => {
  const client = await pool.connect();

  try {
    const { estado } = req.params;

    const query = `
      SELECT 
        s.*,
        c.nombre_cliente,
        c.app_cliente,
        c.apm_cliente,
        u.nombre as coordinador_nombre
      FROM solicitud s
      JOIN cliente c ON s.cliente_id = c.id_cliente
      LEFT JOIN usuario u ON s.coordinador_id = u.id_usuario
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

const guardarGarantia = async (req, res) => {
  const { id_solicitud } = req.params;

  try {
    // Tu código existente aquí
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

    if (solicitud.estado !== "APROBADO") {
      return res.status(400).json({
        error: "La solicitud no está aprobada. No se puede generar garantía."
      });
    }

    const montoAprobado = Number(solicitud.monto_aprobado);

    if (isNaN(montoAprobado) || montoAprobado <= 0) {
      return res.status(400).json({
        error: "La solicitud no tiene un monto aprobado válido."
      });
    }

    const montoGarantia = montoAprobado * 0.10;

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

const eliminarSolicitud = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_solicitud } = req.params;

    await client.query("BEGIN");

    const solicitud = await client.query(
      `SELECT id_solicitud, aval_id, estado, domiciliado
       FROM solicitud 
       WHERE id_solicitud = $1`,
      [id_solicitud]
    );

    if (solicitud.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const { aval_id, estado, domiciliado } = solicitud.rows[0];

    if (estado === 'APROBADO' || domiciliado) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "No se puede eliminar la solicitud",
        detalle: `La solicitud tiene estado: ${estado} ${domiciliado ? '(domiciliada)' : ''}`
      });
    }

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

    await client.query(
      `DELETE FROM solicitud WHERE id_solicitud = $1`,
      [id_solicitud]
    );

    if (aval_id) {
      const avalUso = await client.query(
        `SELECT COUNT(*) AS total 
         FROM solicitud 
         WHERE aval_id = $1`,
        [aval_id]
      );

      if (Number(avalUso.rows[0].total) === 0) {
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
  eliminarSolicitud,
  // Nuevas funciones
  registrarDomiciliacion,
  obtenerSolicitudesPendientesDomiciliacion,
  obtenerSolicitudesDomiciliadas,
  verificarEstadoSolicitud,
  obtenerEstadisticasDomiciliacion
};
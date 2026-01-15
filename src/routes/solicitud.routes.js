// routes/solicitudRoutes.js
const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/auth.middleware');

const {
  guardarSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudesPorCliente,
  obtenerSolicitudPorId,
  obtenerSolicitudesPorEstado,
  aprobarSolicitud,
  rechazarSolicitud,
  guardarGarantia,
  eliminarSolicitud,
  // Nuevas funciones de domiciliación
  registrarDomiciliacion,
  obtenerSolicitudesPendientesDomiciliacion,
  obtenerSolicitudesDomiciliadas,
  verificarEstadoSolicitud,
  obtenerEstadisticasDomiciliacion,
  actualizarEstadoSolicitud
} = require('../controllers/solicitud.controller');

// RUTAS EXISTENTES
// ===========================================

// Obtener todas las solicitudes
router.get('/', obtenerSolicitudes);

// Obtener solicitud por ID
router.get('/:id_solicitud', obtenerSolicitudPorId);

// Obtener solicitudes por cliente
router.get('/cliente/:cliente_id', obtenerSolicitudesPorCliente);

// Obtener solicitudes por estado (PENDIENTE, APROBADO, RECHAZADO)
router.get('/estado/:estado', obtenerSolicitudesPorEstado);

// Guardar una nueva solicitud
router.post('/crear', guardarSolicitud);

// Aprobar una solicitud (Tesorería)
router.put('/aprobar/:id_solicitud', aprobarSolicitud);

// Rechazar una solicitud (Tesorería)
router.put('/rechazar/:id_solicitud', rechazarSolicitud);

// Eliminar una solicitud
router.delete('/:id_solicitud', eliminarSolicitud);

// Garantias
router.post('/garantia/:id_solicitud', guardarGarantia);

// ACTUALIZAR ESTADOS DE SOLICITUD
router.put('/:id_solicitud/estado', actualizarEstadoSolicitud);

// NUEVAS RUTAS PARA DOMICILIACIÓN
// ================================

// 1. Registrar domiciliación (Coordinador)
// RUTAS CON AUTENTICACIÓN FIREBASE
router.put('/:id_solicitud/domiciliar', verifyFirebaseToken, registrarDomiciliacion);
router.get('/domiciliacion/pendientes', verifyFirebaseToken, obtenerSolicitudesPendientesDomiciliacion);
router.get('/domiciliacion/completadas', verifyFirebaseToken, obtenerSolicitudesDomiciliadas);
router.get('/domiciliacion/estadisticas', verifyFirebaseToken, obtenerEstadisticasDomiciliacion);



module.exports = router;
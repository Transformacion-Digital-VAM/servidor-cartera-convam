const express = require('express');
const router = express.Router();

const {
  guardarSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudesPorCliente,
  obtenerSolicitudPorId,
  obtenerSolicitudesPorEstado,
  aprobarSolicitud,
  rechazarSolicitud,
  guardarGarantia,
  eliminarSolicitud
} = require('../controllers/solicitud.controller');

// Obtener todas las solicitudes
router.get('/', obtenerSolicitudes);

// Obtener solicitud por ID
router.get('/:id_solicitud', obtenerSolicitudPorId);

// Obtener solicitudes por cliente
router.get('/cliente/:cliente_id', obtenerSolicitudesPorCliente);

// Obtener solicitudes por estado (PENDIENTE, APROBADO, RECHAZADO)
router.get('/estado/:estado', obtenerSolicitudesPorEstado);

// Guardar una nueva solicitud
router.post('/', guardarSolicitud);

// Aprobar una solicitud
router.put('/aprobar/:id_solicitud', aprobarSolicitud);

// Rechazar una solicitud
router.put('/rechazar/:id_solicitud', rechazarSolicitud);

// Eliminar una solicitud
router.delete('/:id_solicitud', eliminarSolicitud);

// Garantias
router.post('/garantia', guardarGarantia);

module.exports = router;

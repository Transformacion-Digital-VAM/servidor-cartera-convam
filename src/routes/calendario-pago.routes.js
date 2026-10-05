const express = require("express");
const router = express.Router();
const {
  obtenerCalendarioPorPagare,
  obtenerCalendarioPorCliente,
  obtenerCalendarioPorCredito
} = require("../controllers/pagare.controller");

// Rutas de calendario de pago
router.get("/credito/:id_credito", obtenerCalendarioPorCredito);
router.get("/cliente/:id_cliente", obtenerCalendarioPorCliente);
router.get("/:pagare_id", obtenerCalendarioPorPagare);

module.exports = router;

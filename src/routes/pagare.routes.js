const express = require("express");
const router = express.Router();
const { generarPagare, generarHojaControl, obtenerCalendarioPorPagare, obtenerCalendarioPorCliente, obtenerCalendarioPorCredito } = require("../controllers/pagare.controller");

router.get("/:id_credito", generarPagare);
router.get("/hoja-control/:id_credito", generarHojaControl);
router.get("/calendario/:pagare_id", obtenerCalendarioPorPagare);
router.get("/calendario/cliente/:id_cliente", obtenerCalendarioPorCliente);
router.get("/calendario/credito/:id_credito", obtenerCalendarioPorCredito);

module.exports = router;
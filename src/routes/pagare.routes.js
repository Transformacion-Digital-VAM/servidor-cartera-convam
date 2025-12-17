const express = require("express");
const router = express.Router();
const { generarPagare, generarHojaControl } = require("../controllers/pagare.controller");

router.get("/:id_credito", generarPagare);
router.get("/hoja-control/:id_credito", generarHojaControl);

module.exports = router;
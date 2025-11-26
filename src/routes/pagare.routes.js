const express = require("express");
const router = express.Router();
const { generarPagare } = require("../controllers/pagare.controller");

router.post("/generar", generarPagare);

module.exports = router;

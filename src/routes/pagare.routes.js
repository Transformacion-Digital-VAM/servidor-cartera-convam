const express = require("express");
const router = express.Router();
const { generarPagare } = require("../controllers/pagare.controller");

router.get("/:id_credito", generarPagare);

module.exports = router;

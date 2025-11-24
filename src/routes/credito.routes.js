const express = require("express");
const router = express.Router();
const {
  guardarCredito,
  editarCredito,
  eliminarCredito,
  obtenerCreditos,
  obtenerCreditoPorCliente
} = require("../controllers/credito.controller");

router.post("/", guardarCredito);
router.put("/:id", editarCredito);
router.delete("/:id", eliminarCredito);

router.get("/", obtenerCreditos);
router.get("/cliente/:cliente_id", obtenerCreditoPorCliente);

module.exports = router;

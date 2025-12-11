const express = require("express");
const router = express.Router();
const {
  registrarPago,
  consultarPagos,
  consultarPagosCliente,
  consultarPagosPorCredito,
  editarPago,
  eliminarPago
} = require("../controllers/pago.controller");

router.post("/", registrarPago);
router.get("/", consultarPagos);
router.get("/cliente/:cliente_id", consultarPagosCliente);
router.put("/:id", editarPago);
router.delete("/:id", eliminarPago);
router.get('/credito/:credito_id', consultarPagosPorCredito);


module.exports = router;
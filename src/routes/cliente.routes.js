const express = require('express');
const client = require('../controllers/cliente.controller')
const router = express.Router();


router.post('/register-client', client.registrarCliente);


module.exports = router;
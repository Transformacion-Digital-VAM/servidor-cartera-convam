const express = require('express');
const router = express.Router();
const { getUsuarios } = require('../controllers/usuario.controller');

router.get('/', getUsuarios);

module.exports = router;

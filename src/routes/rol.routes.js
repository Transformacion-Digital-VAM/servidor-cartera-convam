const express = require('express');
const router = express.Router();
const { getRol } = require('../controllers/rol.controller');

router.get('/', getRol);

module.exports = router;

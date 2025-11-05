const express = require('express');
const auth = require('../controllers/auth.controller')
const router = express.Router();


router.post('/login', auth.loginUser);
router.post('/register', auth.registerUser);


module.exports = router;
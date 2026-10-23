// routes/publicoRoutes.js
const express = require('express');
const router = express.Router();
const publicoController = require('../controllers/publicoController');

router.get('/seguimiento/:codigo', publicoController.getSeguimiento);

module.exports = router;
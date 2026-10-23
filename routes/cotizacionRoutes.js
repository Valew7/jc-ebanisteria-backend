const express = require('express');
const router = express.Router();
const c = require('../controllers/cotizacionController');

router.post('/', c.crearCotizacion);
router.get('/', c.obtenerCotizaciones);
router.get('/:id', c.obtenerCotizacionPorId);
router.put('/:id/vigencia', c.actualizarVigencia);

module.exports = router;

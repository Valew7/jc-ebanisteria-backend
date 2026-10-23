// routes/productoServicioRoutes.js
const express = require('express');
const router = express.Router();
const productoServicioController = require('../controllers/productoServicioController');

router.get('/', productoServicioController.getProductos);
router.get('/:id', productoServicioController.getProductoById);
router.post('/', productoServicioController.createProducto);
router.put('/:id', productoServicioController.updateProducto);
router.delete('/:id', productoServicioController.deleteProducto);

module.exports = router;
const express = require('express');
const router = express.Router();
const c = require('../controllers/materialUsadoController');

router.post('/', c.registrarMaterialUsado);
router.get('/pedido/:idpedido', c.obtenerMaterialUsadoPorPedido);
router.delete('/:id', c.eliminarMaterialUsado);

module.exports = router;
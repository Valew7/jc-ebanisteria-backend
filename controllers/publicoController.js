// controllers/publicoController.js
// Zona pública: sin login, solo lectura, solo datos no sensibles
const pool = require('../config/db');

const NO_ENCONTRADO = { mensaje: 'Seguimiento no encontrado' };

// GET /api/publico/seguimiento/:codigo
exports.getSeguimiento = async (req, res) => {
  try {
    const { codigo } = req.params;

    // El código real tiene 32 caracteres hexadecimales; cualquier otra cosa
    // responde igual que un código inexistente, sin dar pistas
    if (!/^[a-f0-9]{32}$/.test(codigo)) {
      return res.status(404).json(NO_ENCONTRADO);
    }

    const pedido = await pool.query(
      'SELECT idpedido, estado, fechapedido FROM pedido WHERE codigoseguimiento = $1',
      [codigo]
    );
    if (pedido.rows.length === 0) {
      return res.status(404).json(NO_ENCONTRADO);
    }
    const { idpedido, estado, fechapedido } = pedido.rows[0];

    const productos = await pool.query(
      `SELECT ps.nombre, dp.cantidad
       FROM detalle_pedido dp
       JOIN producto_servicio ps ON ps.idproducto = dp.idproducto
       WHERE dp.idpedido = $1`,
      [idpedido]
    );

    const historial = await pool.query(
      'SELECT estado, fecha, nota FROM historial_estado WHERE idpedido = $1 ORDER BY fecha',
      [idpedido]
    );

    // Lista blanca: solo estos campos salen al público (sin idpedido ni precios)
    res.json({
      estado,
      fechapedido,
      productos: productos.rows,
      historial: historial.rows
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar el seguimiento' });
  }
};
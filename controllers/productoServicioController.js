// controllers/productoServicioController.js
const pool = require('../config/db');

// GET /api/productos
exports.getProductos = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM producto_servicio ORDER BY idproducto');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos/servicios', error: error.message });
  }
};

// GET /api/productos/:id
exports.getProductoById = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM producto_servicio WHERE idproducto = $1', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto/servicio no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el producto/servicio', error: error.message });
  }
};

// POST /api/productos
exports.createProducto = async (req, res) => {
  try {
    const { nombre, tipo, preciobase } = req.body;

    if (!nombre || !tipo || preciobase === undefined) {
      return res.status(400).json({ mensaje: 'Nombre, tipo y preciobase son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO producto_servicio (nombre, tipo, preciobase) VALUES ($1, $2, $3) RETURNING *',
      [nombre, tipo, preciobase]
    );

    res.status(201).json({ mensaje: 'Producto/servicio creado', producto: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el producto/servicio', error: error.message });
  }
};

// PUT /api/productos/:id
exports.updateProducto = async (req, res) => {
  try {
    const { nombre, tipo, preciobase } = req.body;

    const resultado = await pool.query(
      'UPDATE producto_servicio SET nombre = $1, tipo = $2, preciobase = $3 WHERE idproducto = $4 RETURNING *',
      [nombre, tipo, preciobase, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto/servicio no encontrado' });
    }

    res.json({ mensaje: 'Producto/servicio actualizado', producto: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el producto/servicio', error: error.message });
  }
};

// DELETE /api/productos/:id
exports.deleteProducto = async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM producto_servicio WHERE idproducto = $1 RETURNING *', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto/servicio no encontrado' });
    }

    res.json({ mensaje: 'Producto/servicio eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el producto/servicio', error: error.message });
  }
};
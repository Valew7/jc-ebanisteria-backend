// controllers/clienteController.js
const pool = require('../config/db');

// GET /api/clientes
exports.getClientes = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM cliente ORDER BY idcliente');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

// GET /api/clientes/:id
exports.getClienteById = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM cliente WHERE idcliente = $1', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el cliente', error: error.message });
  }
};

// POST /api/clientes
exports.createCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ mensaje: 'Nombre y teléfono son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO cliente (nombre, telefono, direccion, correo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, telefono, direccion, correo]
    );

    res.status(201).json({ mensaje: 'Cliente creado', cliente: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
  }
};

// PUT /api/clientes/:id
exports.updateCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, correo } = req.body;

    const resultado = await pool.query(
      'UPDATE cliente SET nombre = $1, telefono = $2, direccion = $3, correo = $4 WHERE idcliente = $5 RETURNING *',
      [nombre, telefono, direccion, correo, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente actualizado', cliente: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el cliente', error: error.message });
  }
};

// DELETE /api/clientes/:id
exports.deleteCliente = async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM cliente WHERE idcliente = $1 RETURNING *', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el cliente', error: error.message });
  }
};
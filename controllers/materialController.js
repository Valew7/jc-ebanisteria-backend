// controllers/materialController.js
const pool = require('../config/db');

// GET /api/materiales
exports.getMateriales = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM material ORDER BY idmaterial');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materiales', error: error.message });
  }
};

// GET /api/materiales/:id
exports.getMaterialById = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM material WHERE idmaterial = $1', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el material', error: error.message });
  }
};

// POST /api/materiales
exports.createMaterial = async (req, res) => {
  try {
    const { nombre, cantidaddisponible, unidadmedida } = req.body;

    if (!nombre || cantidaddisponible === undefined || !unidadmedida) {
      return res.status(400).json({ mensaje: 'Nombre, cantidaddisponible y unidadmedida son obligatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO material (nombre, cantidaddisponible, unidadmedida) VALUES ($1, $2, $3) RETURNING *',
      [nombre, cantidaddisponible, unidadmedida]
    );

    res.status(201).json({ mensaje: 'Material creado', material: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el material', error: error.message });
  }
};

// PUT /api/materiales/:id
exports.updateMaterial = async (req, res) => {
  try {
    const { nombre, cantidaddisponible, unidadmedida } = req.body;

    const resultado = await pool.query(
      'UPDATE material SET nombre = $1, cantidaddisponible = $2, unidadmedida = $3 WHERE idmaterial = $4 RETURNING *',
      [nombre, cantidaddisponible, unidadmedida, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    res.json({ mensaje: 'Material actualizado', material: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el material', error: error.message });
  }
};

// DELETE /api/materiales/:id
exports.deleteMaterial = async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM material WHERE idmaterial = $1 RETURNING *', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    res.json({ mensaje: 'Material eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el material', error: error.message });
  }
};

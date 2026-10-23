const pool = require('../config/db');

// Crear cotización: el valor total se calcula desde detalle_pedido
const crearCotizacion = async (req, res) => {
  try {
    const { idpedido, fechavalidez } = req.body;

    if (!idpedido || !fechavalidez) {
      return res.status(400).json({ mensaje: 'idpedido y fechavalidez son obligatorios' });
    }

    const pedido = await pool.query('SELECT idpedido FROM pedido WHERE idpedido = $1', [idpedido]);
    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El pedido no existe' });
    }

    const total = await pool.query(
      `SELECT COALESCE(SUM(cantidad * preciounitario), 0) AS total
       FROM detalle_pedido WHERE idpedido = $1`,
      [idpedido]
    );

    const resultado = await pool.query(
      `INSERT INTO cotizacion (idpedido, fechavalidez, valortotal)
       VALUES ($1, $2, $3) RETURNING *`,
      [idpedido, fechavalidez, total.rows[0].total]
    );

    res.status(201).json({ mensaje: 'Cotización creada correctamente', cotizacion: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la cotización' });
  }
};

const obtenerCotizaciones = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM cotizacion ORDER BY idcotizacion');
    res.json({ mensaje: 'Cotizaciones obtenidas', cotizaciones: resultado.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar las cotizaciones' });
  }
};

const obtenerCotizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM cotizacion WHERE idcotizacion = $1', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cotización no encontrada' });
    }
    res.json({ mensaje: 'Cotización encontrada', cotizacion: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar la cotización' });
  }
};

// Actualizar vigencia
const actualizarVigencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechavalidez } = req.body;

    if (!fechavalidez) {
      return res.status(400).json({ mensaje: 'fechavalidez es obligatoria' });
    }

    const resultado = await pool.query(
      'UPDATE cotizacion SET fechavalidez = $1 WHERE idcotizacion = $2 RETURNING *',
      [fechavalidez, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cotización no encontrada' });
    }
    res.json({ mensaje: 'Vigencia actualizada correctamente', cotizacion: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la vigencia' });
  }
};

module.exports = { crearCotizacion, obtenerCotizaciones, obtenerCotizacionPorId, actualizarVigencia };
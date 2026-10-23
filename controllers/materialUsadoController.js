const pool = require('../config/db');

// Registrar material usado y descontar del inventario (transacción)
const registrarMaterialUsado = async (req, res) => {
  const client = await pool.connect();
  try {
    const { idpedido, idmaterial, cantidadusada } = req.body;

    if (!idpedido || !idmaterial || !cantidadusada || cantidadusada <= 0) {
      return res.status(400).json({ mensaje: 'idpedido, idmaterial y cantidadusada (> 0) son obligatorios' });
    }

    await client.query('BEGIN');

    const pedido = await client.query('SELECT idpedido FROM pedido WHERE idpedido = $1', [idpedido]);
    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El pedido no existe' });
    }

    const material = await client.query(
      'SELECT cantidaddisponible FROM material WHERE idmaterial = $1 FOR UPDATE',
      [idmaterial]
    );
    if (material.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El material no existe' });
    }

    if (Number(material.rows[0].cantidaddisponible) < Number(cantidadusada)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        mensaje: 'Stock insuficiente',
        disponible: material.rows[0].cantidaddisponible
      });
    }

    const registro = await client.query(
      `INSERT INTO material_usado (idpedido, idmaterial, cantidadusada)
       VALUES ($1, $2, $3) RETURNING *`,
      [idpedido, idmaterial, cantidadusada]
    );

    await client.query(
      'UPDATE material SET cantidaddisponible = cantidaddisponible - $1 WHERE idmaterial = $2',
      [cantidadusada, idmaterial]
    );

    await client.query('COMMIT');
    res.status(201).json({
      mensaje: 'Material usado registrado y inventario actualizado',
      materialusado: registro.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el material usado' });
  } finally {
    client.release();
  }
};

// Consultar materiales usados de un pedido
const obtenerMaterialUsadoPorPedido = async (req, res) => {
  try {
    const { idpedido } = req.params;
    const resultado = await pool.query(
      `SELECT mu.*, m.nombre, m.unidadmedida
       FROM material_usado mu
       JOIN material m ON m.idmaterial = mu.idmaterial
       WHERE mu.idpedido = $1`,
      [idpedido]
    );
    res.json({ mensaje: 'Materiales usados del pedido', materiales: resultado.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los materiales usados' });
  }
};

// Eliminar registro: devuelve el stock al inventario
const eliminarMaterialUsado = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const eliminado = await client.query(
      'DELETE FROM material_usado WHERE idmaterialusado = $1 RETURNING *',
      [id]
    );
    if (eliminado.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    await client.query(
      'UPDATE material SET cantidaddisponible = cantidaddisponible + $1 WHERE idmaterial = $2',
      [eliminado.rows[0].cantidadusada, eliminado.rows[0].idmaterial]
    );

    await client.query('COMMIT');
    res.json({ mensaje: 'Registro eliminado y stock restituido', materialusado: eliminado.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el registro' });
  } finally {
    client.release();
  }
};

module.exports = { registrarMaterialUsado, obtenerMaterialUsadoPorPedido, eliminarMaterialUsado };
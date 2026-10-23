// controllers/pedidoController.js
const pool = require('../config/db');
const crypto = require('crypto');
const ESTADOS_VALIDOS = ['cotizado', 'en proceso', 'terminado', 'entregado'];

// GET /api/pedidos - listar todos los pedidos
exports.getPedidos = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pedido ORDER BY idpedido');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
  }
};

// GET /api/pedidos/:id - ver un pedido con sus detalles (productos incluidos)
exports.getPedidoById = async (req, res) => {
  try {
    const pedido = await pool.query('SELECT * FROM pedido WHERE idpedido = $1', [req.params.id]);
    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const detalles = await pool.query(
      `SELECT dp.iddetalle, dp.idproducto, ps.nombre, dp.cantidad, dp.preciounitario
       FROM detalle_pedido dp
       JOIN producto_servicio ps ON ps.idproducto = dp.idproducto
       WHERE dp.idpedido = $1`,
      [req.params.id]
    );

    res.json({ ...pedido.rows[0], detalles: detalles.rows });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el pedido', error: error.message });
  }
};

// POST /api/pedidos - crear un pedido junto con sus detalles (productos)
exports.createPedido = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { idcliente, idusuario, detalles } = req.body;

    if (!idcliente || !idusuario || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: 'idcliente, idusuario y al menos un producto en detalles son obligatorios'
      });
    }

    const cliente = await client.query(
      'SELECT idcliente FROM cliente WHERE idcliente = $1',
      [idcliente]
    );
    if (cliente.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El cliente no existe' });
    }

    await client.query('BEGIN');

    // Código aleatorio de 32 caracteres para el link de seguimiento
    const codigoseguimiento = crypto.randomBytes(16).toString('hex');

    const pedidoResultado = await client.query(
      'INSERT INTO pedido (idcliente, idusuario, codigoseguimiento) VALUES ($1, $2, $3) RETURNING *',
      [idcliente, idusuario, codigoseguimiento]
    );
    const nuevoPedido = pedidoResultado.rows[0];

    // Primera fila del historial: el estado inicial del pedido
    await client.query(
      'INSERT INTO historial_estado (idpedido, estado, idusuario) VALUES ($1, $2, $3)',
      [nuevoPedido.idpedido, nuevoPedido.estado, idusuario]
    );

    const detallesInsertados = [];
    for (const item of detalles) {
      const { idproducto, cantidad, preciounitario } = item;

      if (!idproducto || !cantidad || preciounitario === undefined) {
        throw new Error('Cada detalle necesita idproducto, cantidad y preciounitario');
      }

      const detalleResultado = await client.query(
        `INSERT INTO detalle_pedido (idpedido, idproducto, cantidad, preciounitario)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [nuevoPedido.idpedido, idproducto, cantidad, preciounitario]
      );
      detallesInsertados.push(detalleResultado.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Pedido creado con sus detalles',
      pedido: nuevoPedido,
      detalles: detallesInsertados
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ mensaje: 'Error al crear el pedido', error: error.message });
  } finally {
    client.release();
  }
};

// PUT /api/pedidos/:id/estado - actualizar solo el estado del pedido

// PUT /api/pedidos/:id/estado - actualizar solo el estado del pedido
exports.updateEstadoPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    const { estado, nota, idusuario } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado no válido',
        estadosPermitidos: ESTADOS_VALIDOS
      });
    }
    if (nota && nota.length > 200) {
      return res.status(400).json({ mensaje: 'La nota no puede superar 200 caracteres' });
    }

    await client.query('BEGIN');

    const resultado = await client.query(
      'UPDATE pedido SET estado = $1 WHERE idpedido = $2 RETURNING *',
      [estado, req.params.id]
    );
    if (resultado.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    await client.query(
      'INSERT INTO historial_estado (idpedido, estado, nota, idusuario) VALUES ($1, $2, $3, $4)',
      [req.params.id, estado, nota || null, idusuario || null]
    );

    await client.query('COMMIT');
    res.json({ mensaje: 'Estado actualizado', pedido: resultado.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ mensaje: 'Error al actualizar el estado', error: error.message });
  } finally {
    client.release();
  }
};

// DELETE /api/pedidos/:id - elimina el pedido y todo lo asociado
// Antes de borrar, devuelve al inventario el material que el pedido había usado
exports.deletePedido = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pedido = await client.query(
      'SELECT idpedido FROM pedido WHERE idpedido = $1 FOR UPDATE',
      [req.params.id]
    );
    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // 1. Restituir el stock de los materiales usados en este pedido
    await client.query(
      `UPDATE material m
       SET cantidaddisponible = m.cantidaddisponible + mu.total
       FROM (
         SELECT idmaterial, SUM(cantidadusada) AS total
         FROM material_usado
         WHERE idpedido = $1
         GROUP BY idmaterial
       ) mu
       WHERE m.idmaterial = mu.idmaterial`,
      [req.params.id]
    );

    // 2. Borrar lo asociado y luego el pedido
    await client.query('DELETE FROM historial_estado WHERE idpedido = $1', [req.params.id]);
    await client.query('DELETE FROM material_usado WHERE idpedido = $1', [req.params.id]);
    await client.query('DELETE FROM cotizacion WHERE idpedido = $1', [req.params.id]);
    await client.query('DELETE FROM detalle_pedido WHERE idpedido = $1', [req.params.id]);
    await client.query('DELETE FROM pedido WHERE idpedido = $1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ mensaje: 'Pedido eliminado y stock restituido' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ mensaje: 'Error al eliminar el pedido', error: error.message });
  } finally {
    client.release();
  }
};
// GET /api/pedidos/:id/presupuesto - RF06: calcular el presupuesto total del pedido
// El total se calcula sumando (cantidad * preciounitario) de cada detalle del pedido
exports.calcularPresupuesto = async (req, res) => {
  try {
    const pedido = await pool.query('SELECT * FROM pedido WHERE idpedido = $1', [req.params.id]);
    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const detalles = await pool.query(
      `SELECT dp.idproducto, ps.nombre, dp.cantidad, dp.preciounitario,
              (dp.cantidad * dp.preciounitario) AS subtotal
       FROM detalle_pedido dp
       JOIN producto_servicio ps ON ps.idproducto = dp.idproducto
       WHERE dp.idpedido = $1`,
      [req.params.id]
    );

    if (detalles.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Este pedido no tiene productos asociados' });
    }

    const total = detalles.rows.reduce((suma, item) => suma + Number(item.subtotal), 0);

    res.json({
      idpedido: pedido.rows[0].idpedido,
      estado: pedido.rows[0].estado,
      detalles: detalles.rows,
      presupuestoTotal: total
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular el presupuesto', error: error.message });
  }
};
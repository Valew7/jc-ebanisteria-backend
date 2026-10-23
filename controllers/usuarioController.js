// controllers/usuarioController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/usuarios (sin devolver la contraseña)
exports.getUsuarios = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT idusuario, nombre, usuario, rol FROM usuario ORDER BY idusuario');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

// GET /api/usuarios/:id
exports.getUsuarioById = async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT idusuario, nombre, usuario, rol FROM usuario WHERE idusuario = $1',
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el usuario', error: error.message });
  }
};

// POST /api/usuarios (registro, con contraseña encriptada)
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, usuario, contrasena, rol } = req.body;

    if (!nombre || !usuario || !contrasena || !rol) {
      return res.status(400).json({ mensaje: 'Nombre, usuario, contraseña y rol son obligatorios' });
    }

    const existe = await pool.query('SELECT idusuario FROM usuario WHERE usuario = $1', [usuario]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ mensaje: 'Ya existe ese nombre de usuario' });
    }

    const contrasenahash = await bcrypt.hash(contrasena, 10);

    const resultado = await pool.query(
      'INSERT INTO usuario (nombre, usuario, contrasenahash, rol) VALUES ($1, $2, $3, $4) RETURNING idusuario, nombre, usuario, rol',
      [nombre, usuario, contrasenahash, rol]
    );

    res.status(201).json({ mensaje: 'Usuario creado', usuario: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
  }
};

// PUT /api/usuarios/:id
exports.updateUsuario = async (req, res) => {
  try {
    const { nombre, usuario, rol } = req.body;

    const resultado = await pool.query(
      'UPDATE usuario SET nombre = $1, usuario = $2, rol = $3 WHERE idusuario = $4 RETURNING idusuario, nombre, usuario, rol',
      [nombre, usuario, rol, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado', usuario: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
  }
};

// DELETE /api/usuarios/:id
exports.deleteUsuario = async (req, res) => {
  try {
    const resultado = await pool.query('DELETE FROM usuario WHERE idusuario = $1 RETURNING *', [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
  }
};

// POST /api/usuarios/login
exports.login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
    }

    const resultado = await pool.query('SELECT * FROM usuario WHERE usuario = $1', [usuario]);
    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuarioEncontrado = resultado.rows[0];
    const coincide = await bcrypt.compare(contrasena, usuarioEncontrado.contrasenahash);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        idusuario: usuarioEncontrado.idusuario,
        nombre: usuarioEncontrado.nombre,
        usuario: usuarioEncontrado.usuario,
        rol: usuarioEncontrado.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
};
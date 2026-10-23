// config/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'jc_ebanisteria_db',
  port: process.env.DB_PORT || 5432
});

pool.connect()
  .then(client => {
    console.log('Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('Error de conexión a PostgreSQL:', err.message);
  });

module.exports = pool;
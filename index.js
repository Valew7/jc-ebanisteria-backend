// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const clienteRoutes = require('./routes/clienteRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoServicioRoutes = require('./routes/productoServicioRoutes');
const materialRoutes = require('./routes/materialRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoServicioRoutes);
app.use('/api/materiales', materialRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/cotizaciones', require('./routes/cotizacionRoutes'));
app.use('/api/materialusado', require('./routes/materialUsadoRoutes'));
app.use('/api/publico', require('./routes/publicoRoutes'));

app.get('/', (req, res) => {
  res.send('API JC Ebanistería funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
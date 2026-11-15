require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { networkLogger } = require('./middleware/networkLogger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dfaRoutes = require('./routes/dfaRoutes');
const networkRoutes = require('./routes/networkRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Security and Network Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server and academic demonstration
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Computer Networks Telemetry Logging Middleware
app.use(networkLogger);

// System Health & Academic Context API
app.get('/', (req, res) => {
  res.json({
    project: 'E-Commerce Shopping and Order Management System Using DFA',
    courseContext: 'MERN Stack + Computer Networks + Formal Languages & Automata Theory',
    status: 'ONLINE',
    protocol: req.protocol.toUpperCase(),
    dfaModel: 'M = (Q, Σ, δ, q0, F)',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      dfa: '/api/dfa',
      network: '/api/network'
    },
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dfa', dfaRoutes);
app.use('/api/network', networkRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 E-Commerce DFA Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 Server Port: ${PORT}`);
  console.log(`📡 Network Protocol: HTTP/REST API`);
  console.log(`🔀 DFA State Engine: Active (Q: {S0..S6}, F: {S5})`);
  console.log(`====================================================`);
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { loadVercelEnv, getApiBaseUrl } = require('./_utils');

// Load environment variables
loadVercelEnv();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`, process.env.VERCEL_URL, 'http://localhost:5173']
    : ['http://localhost:5173']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const telegramRoutes = require('../backend/routes/telegram');
const analysisRoutes = require('../backend/routes/analysis');
const reportRoutes = require('../backend/routes/reports');
const batchRoutes = require('../backend/routes/batch');

// Routes
app.use('/telegram', telegramRoutes);
app.use('/analysis', analysisRoutes);
app.use('/reports', reportRoutes);
app.use('/batch', batchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Telegram Analyzer API',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
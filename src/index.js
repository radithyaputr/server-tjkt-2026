require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: false,
}));
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN, credentials: true }
  : {};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan('dev')); // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('src/public')); // Static frontend (if any)

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Strict Login Rate Limiter (prevents brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message || err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred.' : err.message
  });
});

// Database Sync and Server Start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('FATAL: Unable to connect to the database:', err);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

startServer();

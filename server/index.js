const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS configuration for production
const allowedOrigins = [
  'https://kotakbasai.vercel.app',
  'https://kotakbasai.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-password']
}));

app.use(express.json());

// MongoDB connection with better error handling
mongoose.set('debug', true);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kotakbasai')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Connection string:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  });

// Routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'kotakbasai-backend'
  });
});

// Serve static files from Vite build (for Render full-stack deployment)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../client/dist');
  console.log('📁 Serving static files from:', staticPath);
  app.use(express.static(staticPath));

  // Handle React routing - return index.html for all non-API routes (Express 5 syntax)
  app.get('/{*splat}', (req, res) => {
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    console.log('📄 Serving index.html:', indexPath);
    res.sendFile(indexPath);
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

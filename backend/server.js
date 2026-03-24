const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const transactionRoutes = require('./routes/transactionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded files
// Note: /tmp is used for Vercel/serverless in uploadController
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection (Singleton version for Serverless)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/finance_tracker';
    const db = await mongoose.connect(mongoURI);
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    // In serverless, we don't want to process.exit(1) as it kills the function
    if (!process.env.VERCEL) process.exit(1);
  }
};

// Routes
// Ensure DB is connected before handling routes (Middleware for serverless)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Finance tracker API is healthy',
    timestamp: new Date().toISOString(),
    dbConnected: isConnected
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Finance Tracker API',
    endpoints: ['/api/transactions', '/api/upload', '/api/health']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (only if not running on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Local Server running on port ${PORT}`);
    });
  });
}

// Export the app for Vercel serverless functions
module.exports = app;

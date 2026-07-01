require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));

// Test route
app.get('/', (req, res) => {
  res.send('NutriNest Backend is running');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
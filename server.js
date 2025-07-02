require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const logger = require('./middleware/logger');
const { initializeDataFiles } = require('./utils/fileHandler');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(logger);

// Routes
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initializeDataFiles().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
});

const express = require('express');
const cors = require('cors');
const examRoutes = require('../server/routes/examRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Mount the API routes
app.use('/api', examRoutes);

// Export serverless handler for Vercel
module.exports = app;

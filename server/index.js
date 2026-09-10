const express = require('express');
const cors = require('cors');
const path = require('path');
const examRoutes = require('./routes/examRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', examRoutes);

// Serve static React build files if available in dist/
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to legacy public if dist doesn't exist yet
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.listen(PORT, () => {
  console.log(`[ProctorShield Express API] running at http://localhost:${PORT}`);
});

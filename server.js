require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./src/routes/weather'));
app.use('/api/favorites', require('./src/routes/favorites'));
app.use('/api', notFound);

// Frontend
app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Weather app running at http://localhost:${PORT}`));

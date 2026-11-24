const express = require('express');
const pool = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { cleanCity } = require('../middleware/validate');
const { getWeather } = require('../services/weather');

const router = express.Router();

router.get('/weather', asyncHandler(async (req, res) => {
  const city = cleanCity(req.query.city);
  const { data, cached } = await getWeather(city, 'current');
  // Log only successful searches (a bad city throws above)
  await pool.query('INSERT INTO search_history (city, country) VALUES (?, ?)', [data.city, data.country]);
  res.json({ ...data, cached });
}));

router.get('/forecast', asyncHandler(async (req, res) => {
  const city = cleanCity(req.query.city);
  const { data, cached } = await getWeather(city, 'forecast');
  res.json({ ...data, cached });
}));

router.get('/history', asyncHandler(async (req, res) => {
  const [recent] = await pool.query(
    'SELECT id, city, country, searched_at FROM search_history ORDER BY searched_at DESC, id DESC LIMIT 10'
  );
  // Aggregation: most searched cities
  const [top] = await pool.query(
    `SELECT city, COUNT(*) AS searches FROM search_history
     GROUP BY city ORDER BY searches DESC, city LIMIT 5`
  );
  res.json({ recent, top });
}));

module.exports = router;

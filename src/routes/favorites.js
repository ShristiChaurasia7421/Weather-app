const express = require('express');
const pool = require('../db');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { cleanCity } = require('../middleware/validate');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, city, country, created_at FROM favorites ORDER BY created_at DESC');
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const city = cleanCity(req.body?.city);
  const country = typeof req.body.country === 'string' && /^[A-Za-z]{2}$/.test(req.body.country)
    ? req.body.country.toUpperCase() : null;
  try {
    const [result] = await pool.query('INSERT INTO favorites (city, country) VALUES (?, ?)', [city, country]);
    res.status(201).json({ id: result.insertId, city, country });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, `"${city}" is already in favorites`);
    throw err;
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid id');
  const [result] = await pool.query('DELETE FROM favorites WHERE id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Favorite not found');
  res.status(204).end();
}));

module.exports = router;

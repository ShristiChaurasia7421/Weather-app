const { HttpError } = require('./errorHandler');

// Letters (any language), spaces, dots, hyphens, apostrophes; 1-100 chars
const CITY_RE = /^[\p{L}][\p{L}\s.'-]{0,99}$/u;

function cleanCity(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'City is required');
  }
  const city = value.trim().replace(/\s+/g, ' ');
  if (!CITY_RE.test(city)) {
    throw new HttpError(400, 'City contains invalid characters');
  }
  return city;
}

module.exports = { cleanCity };

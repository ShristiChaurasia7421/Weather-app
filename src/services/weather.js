const pool = require('../db');
const { HttpError } = require('../middleware/errorHandler');

const BASE = 'https://api.openweathermap.org/data/2.5';

// Fetch from OpenWeatherMap, with a DB cache (kind = 'current' | 'forecast')
async function getWeather(city, kind) {
  const cityKey = city.toLowerCase();
  const ttl = Number(process.env.CACHE_MINUTES) || 10;

  const [rows] = await pool.query(
    `SELECT payload FROM weather_cache
     WHERE city_key = ? AND kind = ? AND fetched_at > NOW() - INTERVAL ? MINUTE`,
    [cityKey, kind, ttl]
  );
  if (rows.length) {
    const p = rows[0].payload;
    return { data: typeof p === 'string' ? JSON.parse(p) : p, cached: true };
  }

  const endpoint = kind === 'current' ? 'weather' : 'forecast';
  const url = `${BASE}/${endpoint}?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new HttpError(502, 'Could not reach the weather service');
  }
  if (res.status === 404) throw new HttpError(404, `City "${city}" not found`);
  if (!res.ok) throw new HttpError(502, 'Weather service error');

  const raw = await res.json();
  const data = kind === 'current' ? shapeCurrent(raw) : shapeForecast(raw);

  await pool.query(
    `INSERT INTO weather_cache (city_key, kind, payload, fetched_at) VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = NOW()`,
    [cityKey, kind, JSON.stringify(data)]
  );
  return { data, cached: false };
}

// Keep only what the frontend needs
function shapeCurrent(r) {
  return {
    city: r.name,
    country: r.sys.country,
    temp: Math.round(r.main.temp),
    feelsLike: Math.round(r.main.feels_like),
    humidity: r.main.humidity,
    pressure: r.main.pressure,
    windSpeed: r.wind.speed,
    description: r.weather[0].description,
    icon: r.weather[0].icon,
    sunrise: r.sys.sunrise,
    sunset: r.sys.sunset,
    timezone: r.timezone,
  };
}

// OpenWeatherMap gives 3-hour slots; group into one entry per day
function shapeForecast(r) {
  const days = new Map();
  for (const s of r.list) {
    const date = new Date((s.dt + r.city.timezone) * 1000).toISOString().slice(0, 10);
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(s);
  }
  const daily = [...days.entries()].map(([date, slots]) => {
    const noon = slots.reduce((a, b) =>
      Math.abs(new Date((b.dt + r.city.timezone) * 1000).getUTCHours() - 12) <
      Math.abs(new Date((a.dt + r.city.timezone) * 1000).getUTCHours() - 12) ? b : a);
    return {
      date,
      min: Math.round(Math.min(...slots.map((s) => s.main.temp_min))),
      max: Math.round(Math.max(...slots.map((s) => s.main.temp_max))),
      humidity: Math.round(slots.reduce((n, s) => n + s.main.humidity, 0) / slots.length),
      description: noon.weather[0].description,
      icon: noon.weather[0].icon,
    };
  });
  return { city: r.city.name, country: r.city.country, days: daily.slice(0, 5) };
}

module.exports = { getWeather };

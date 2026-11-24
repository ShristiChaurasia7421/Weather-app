const $ = (id) => document.getElementById(id);
const form = $('search-form');
const input = $('city-input');
let current = null; // last successfully loaded city: { city, country }

// ---- helpers ----
async function api(path, options) {
  let res;
  try {
    res = await fetch(`/api${path}`, options);
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Something went wrong');
  return body;
}

function showMessage(text, type = 'info') {
  const el = $('message');
  el.textContent = text;
  el.className = `message ${type}`;
  el.hidden = !text;
}

const iconUrl = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

// ---- search ----
async function search(city) {
  showMessage('Loading…');
  form.querySelector('button').disabled = true;
  try {
    const [weather, forecast] = await Promise.all([
      api(`/weather?city=${encodeURIComponent(city)}`),
      api(`/forecast?city=${encodeURIComponent(city)}`),
    ]);
    showMessage('');
    renderCurrent(weather);
    renderForecast(forecast);
    loadHistory();
  } catch (err) {
    $('current').hidden = true;
    $('forecast').hidden = true;
    current = null;
    showMessage(err.message, 'error');
  } finally {
    form.querySelector('button').disabled = false;
  }
}

function renderCurrent(w) {
  current = { city: w.city, country: w.country };
  $('c-city').textContent = `${w.city}, ${w.country}`;
  $('c-desc').textContent = w.description;
  $('c-icon').src = iconUrl(w.icon);
  $('c-icon').alt = w.description;
  $('c-temp').textContent = w.temp;
  $('c-feels').textContent = `${w.feelsLike}°C`;
  $('c-humidity').textContent = `${w.humidity}%`;
  $('c-wind').textContent = `${w.windSpeed} m/s`;
  $('c-pressure').textContent = `${w.pressure} hPa`;
  $('current').hidden = false;
  updateFavButton();
}

function renderForecast(f) {
  const list = $('forecast-list');
  list.replaceChildren();
  for (const d of f.days) {
    const day = document.createElement('div');
    day.className = 'day';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const img = document.createElement('img');
    img.src = iconUrl(d.icon);
    img.alt = d.description;
    const range = document.createElement('div');
    range.className = 'range';
    range.textContent = `${d.max}° `;
    const low = document.createElement('span');
    low.textContent = `${d.min}°`;
    range.append(low);
    day.append(name, img, range);
    list.append(day);
  }
  $('forecast').hidden = false;
}

// ---- favorites ----
let favorites = [];

async function loadFavorites() {
  favorites = await api('/favorites');
  renderChips('favorites', 'fav-empty', favorites, true);
  updateFavButton();
}

function updateFavButton() {
  const btn = $('fav-btn');
  const saved = current && favorites.find((f) => f.city.toLowerCase() === current.city.toLowerCase());
  btn.textContent = saved ? '★ Remove from favorites' : '☆ Save to favorites';
  btn.dataset.id = saved ? saved.id : '';
}

$('fav-btn').addEventListener('click', async () => {
  if (!current) return;
  try {
    const id = $('fav-btn').dataset.id;
    if (id) await api(`/favorites/${id}`, { method: 'DELETE' });
    else await api('/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    });
    await loadFavorites();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

// ---- history ----
async function loadHistory() {
  const { recent } = await api('/history');
  // de-duplicate city names, keep order
  const seen = new Set();
  const unique = recent.filter((r) => !seen.has(r.city) && seen.add(r.city));
  renderChips('history', 'hist-empty', unique, false);
}

// ---- chip lists (favorites + history) ----
function renderChips(listId, emptyId, items, removable) {
  const ul = $(listId);
  ul.replaceChildren();
  $(emptyId).hidden = items.length > 0;
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'chip';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.city;
    btn.addEventListener('click', () => { input.value = item.city; search(item.city); });
    li.append(btn);
    if (removable) {
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'remove';
      rm.textContent = '×';
      rm.setAttribute('aria-label', `Remove ${item.city}`);
      rm.addEventListener('click', async () => {
        try { await api(`/favorites/${item.id}`, { method: 'DELETE' }); await loadFavorites(); }
        catch (err) { showMessage(err.message, 'error'); }
      });
      li.append(rm);
    }
    ul.append(li);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (city) search(city);
});

loadFavorites().catch((e) => showMessage(e.message, 'error'));
loadHistory().catch(() => {});

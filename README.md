# Weather Forecast Web App

Search any city for current weather and a 5-day forecast. Save favorite cities and see recent searches.

**Stack:** Node.js, Express, MySQL, HTML5/CSS3/JavaScript (fetch, async/await), OpenWeatherMap API.

## Setup
1. `npm install`
2. Create the database: `mysql -u root -p < database/schema.sql`
3. Create `.env` (never commit it):
   ```
   PORT=3000
   OPENWEATHER_API_KEY=your_key
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=weather_app
   CACHE_MINUTES=10
   ```
4. `npm start` and open http://localhost:3000

## API
| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/api/weather?city=` | Current weather | 200, 400, 404, 502 |
| GET | `/api/forecast?city=` | 5-day forecast | 200, 400, 404, 502 |
| GET | `/api/history` | Recent + most searched cities | 200 |
| GET | `/api/favorites` | List favorites | 200 |
| POST | `/api/favorites` | Add favorite `{city, country?}` | 201, 400, 409 |
| DELETE | `/api/favorites/:id` | Remove favorite | 204, 400, 404 |

OpenWeatherMap responses are cached in MySQL for 10 minutes (`weather_cache`).

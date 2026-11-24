// Simple version of the weather API: one file, same style as the basic "real world API" example.
// Run:  node simple-weather.js
// Test: http://localhost:3001/weather?city=Delhi
//
// Uses OPENWEATHER_API_KEY from the .env file in this folder (same key as the full app).

require('dotenv').config();

const express = require('express');

const app = express();

app.get('/weather', async (req, res) => {

    try {

        // 1. Read the city from the query string  (?city=Delhi)
        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                message: "city is required, e.g. /weather?city=Delhi"
            });
        }

        // 2. Build the OpenWeatherMap URL (units=metric gives Celsius instead of Kelvin)
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;

        // 3. Call the external API
        const response = await fetch(url);

        console.log(response.status);   // status from OpenWeatherMap (never log the API key)

        if (!response.ok) {
            return res.status(response.status).json({
                message: "External API request failed"
            });
        }

        // 4. Send the raw OpenWeatherMap JSON straight back
        const data = await response.json();

        res.json(data);
    }
    catch (error) {
        res.status(500).json({              // 500 = server side issue
            message: "Something went wrong",
            error: error.message
        });
    }
});

app.listen(3001, () => {

    console.log('Server running on port 3001');

});

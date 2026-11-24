-- Weather App schema (MySQL 8)
-- Run with: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS weather_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE weather_app;

-- Every city a user searched. Used for "recent searches" and "most searched".
CREATE TABLE IF NOT EXISTS search_history (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city        VARCHAR(100) NOT NULL,
  country     CHAR(2)      NULL,
  searched_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_city (city),
  INDEX idx_history_searched_at (searched_at)
);

-- Saved cities. UNIQUE stops the same city being saved twice.
CREATE TABLE IF NOT EXISTS favorites (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city       VARCHAR(100) NOT NULL,
  country    CHAR(2)      NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_favorites_city (city)
);

-- Cached OpenWeatherMap responses (current + forecast) to avoid repeat API calls.
CREATE TABLE IF NOT EXISTS weather_cache (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_key   VARCHAR(100) NOT NULL,          -- lowercase city name
  kind       ENUM('current','forecast') NOT NULL,
  payload    JSON         NOT NULL,          -- raw API response
  fetched_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cache (city_key, kind)       -- one row per city+kind, overwritten on refresh
);

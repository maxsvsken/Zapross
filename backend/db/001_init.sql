-- ============================================
-- ZapRos: Инициализация базы данных
-- PostgreSQL + PostGIS
-- ============================================

-- Подключение к БД: psql -U postgres -d zapros

-- Включаем расширение PostGIS (нужно выполнить один раз)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Таблица stations (АЗС)
-- ============================================
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Пространственный индекс для быстрого поиска по BBox
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations USING GIST (location);

-- Индекс по бренду для фильтрации
CREATE INDEX IF NOT EXISTS idx_stations_brand ON stations (brand);

-- ============================================
-- Таблица prices (Цены на топливо)
-- ============================================
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ')),
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'anonymous',
    UNIQUE(station_id, fuel_type)
);

-- Индекс по station_id для быстрого получения цен заправки
CREATE INDEX IF NOT EXISTS idx_prices_station_id ON prices (station_id);

-- Индекс по типу топлива
CREATE INDEX IF NOT EXISTS idx_prices_fuel_type ON prices (fuel_type);

-- ============================================
-- Функция автоматического обновления updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для stations
CREATE TRIGGER update_stations_updated_at
    BEFORE UPDATE ON stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для prices
CREATE TRIGGER update_prices_updated_at
    BEFORE UPDATE ON prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Функция поиска АЗС по BBox
-- ============================================
CREATE OR REPLACE FUNCTION find_stations_in_bbox(
    min_lon DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lon DOUBLE PRECISION,
    max_lat DOUBLE PRECISION
)
RETURNS TABLE (
    id UUID,
    brand VARCHAR(100),
    address TEXT,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.brand,
        s.address,
        ST_X(s.location)::DOUBLE PRECISION AS longitude,
        ST_Y(s.location)::DOUBLE PRECISION AS latitude
    FROM stations s
    WHERE ST_Within(
        s.location,
        ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    );
END;
$$ LANGUAGE plpgsql STABLE;

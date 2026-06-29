-- ============================================
-- ZapRos: Тестовые данные
-- ============================================

-- Вставляем тестовые АЗС (Москва и область)
INSERT INTO stations (brand, address, location) VALUES
    ('Лукойл', 'ул. Тверская, 1, Москва', ST_SetSRID(ST_MakePoint(37.6085, 55.7578), 4326)),
    ('Газпромнефть', 'ул. Арбат, 10, Москва', ST_SetSRID(ST_MakePoint(37.5943, 55.7520), 4326)),
    ('Роснефть', 'Ленинский пр-т, 30, Москва', ST_SetSRID(ST_MakePoint(37.5710, 55.6930), 4326)),
    ('ТНК', 'ул. Профсоюзная, 56, Москва', ST_SetSRID(ST_MakePoint(37.5670, 55.6760), 4326)),
    ('Shell', 'Кутузовский пр-т, 26, Москва', ST_SetSRID(ST_MakePoint(37.5450, 55.7420), 4326)),
    ('BP', 'ул. Сущёвский Вал, 5, Москва', ST_SetSRID(ST_MakePoint(37.5960, 55.7860), 4326)),
    ('Лукойл', 'МКАД 54-й км, Москва', ST_SetSRID(ST_MakePoint(37.8430, 55.6200), 4326)),
    ('Газпромнефть', 'Рязанский пр-т, 75, Москва', ST_SetSRID(ST_MakePoint(37.7430, 55.7180), 4326)),
    ('Роснефть', 'ул. Бауманская, 33, Москва', ST_SetSRID(ST_MakePoint(37.6820, 55.7700), 4326)),
    ('Лукойл', 'ул. Щербаковская, 30, Москва', ST_SetSRID(ST_MakePoint(37.8540, 55.7560), 4326)),
    ('ТНК', 'ул. Перерва, 112, Москва', ST_SetSRID(ST_MakePoint(37.7420, 55.6540), 4326)),
    ('Газпромнефть', 'Каширское шоссе, 26, Москва', ST_SetSRID(ST_MakePoint(37.6470, 55.6230), 4326)),
    ('Лукойл', 'ул. Люблинская, 169, Москва', ST_SetSRID(ST_MakePoint(37.7450, 55.6500), 4326)),
    ('Роснефть', 'Пятницкое шоссе, 37, Москва', ST_SetSRID(ST_MakePoint(37.3540, 55.8540), 4326)),
    ('Shell', 'ул. Нижегородская, 32, Москва', ST_SetSRID(ST_MakePoint(37.7320, 55.7340), 4326));

-- Вставляем тестовые цены
INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-92', 52.90, 'test_user'
FROM stations s WHERE s.address = 'ул. Тверская, 1, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-95', 57.50, 'test_user'
FROM stations s WHERE s.address = 'ул. Тверская, 1, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'ДТ', 58.20, 'test_user'
FROM stations s WHERE s.address = 'ул. Тверская, 1, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-92', 52.70, 'test_user'
FROM stations s WHERE s.address = 'ул. Арбат, 10, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-95', 57.30, 'test_user'
FROM stations s WHERE s.address = 'ул. Арбат, 10, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'ДТ', 58.00, 'test_user'
FROM stations s WHERE s.address = 'ул. Арбат, 10, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-92', 53.10, 'test_user'
FROM stations s WHERE s.address = 'Ленинский пр-т, 30, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-95', 57.70, 'test_user'
FROM stations s WHERE s.address = 'Ленинский пр-т, 30, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'ДТ', 58.40, 'test_user'
FROM stations s WHERE s.address = 'Ленинский пр-т, 30, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-92', 52.50, 'test_user'
FROM stations s WHERE s.address = 'ул. Профсоюзная, 56, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-95', 57.10, 'test_user'
FROM stations s WHERE s.address = 'ул. Профсоюзная, 56, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'ДТ', 57.80, 'test_user'
FROM stations s WHERE s.address = 'ул. Профсоюзная, 56, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-92', 53.00, 'test_user'
FROM stations s WHERE s.address = 'Кутузовский пр-т, 26, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'АИ-95', 57.60, 'test_user'
FROM stations s WHERE s.address = 'Кутузовский пр-т, 26, Москва';

INSERT INTO prices (station_id, fuel_type, price, updated_by)
SELECT s.id, 'ДТ', 58.30, 'test_user'
FROM stations s WHERE s.address = 'Кутузовский пр-т, 26, Москва';

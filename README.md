# ZapRos - Сервис поиска АЗС и мониторинга цен

Краудсорсинговый сервис для поиска АЗС и отслеживания цен на топливо в реальном времени.

## Архитектура

```
zapros/
├── backend/          # FastAPI + PostgreSQL + PostGIS
├── web/              # React + Leaflet + OpenStreetMap
├── mobile/           # React Native + Expo + OpenStreetMap
└── docs/             # Документация
```

## Быстрый старт

### 1. База данных

```bash
# Установите PostgreSQL + PostGIS
# Создайте базу данных
psql -U postgres -c "CREATE DATABASE zapros;"
psql -U postgres -d zapros -c "CREATE EXTENSION postgis;"

# Накатите миграции
psql -U postgres -d zapros -f backend/db/001_init.sql

# Заполните тестовыми данными (опционально)
psql -U postgres -d zapros -f backend/db/002_seed.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Настройте DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

### 3. Web-клиент

```bash
cd web
npm install
npm run dev
```

### 4. Мобильное приложение

```bash
cd mobile
npm install
npx expo start
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/stations?bbox=...` | АЗС в области (minLon,minLat,maxLon,maxLat) |
| GET | `/api/stations/:id` | Детали АЗС с ценами |
| POST | `/api/stations/:id/prices` | Обновить цену на топливо |

## Лицензия

MIT

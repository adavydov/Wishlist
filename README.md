# Wishlist подарков на день рождения Темы

Проект переведен с SQLite на **PostgreSQL** для постоянного хранения на Render.

## Что умеет проект

- Показывает фиксированный список подарков.
- Позволяет бронировать подарок по имени.
- Не дает забронировать один и тот же подарок дважды (серверная защита).
- Хранит данные в PostgreSQL и переживает перезапуск приложения.

## Технологии

- Node.js + Express
- PostgreSQL (`pg`)

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Обязательные переменные:

- `DATABASE_URL` — строка подключения к Postgres.
- `PORT` — порт приложения (по умолчанию 3000).

## Локальный запуск

```bash
npm install
npm start
```

Приложение поднимется на `http://localhost:3000`.

## Миграции / SQL

Используется SQL-файл:

- `migrations/001_init.sql`

Он автоматически выполняется при старте сервера (`initDb()`), создает таблицу `gifts` и ограничения целостности.

## Защита от двойного бронирования

На сервере используется атомарный запрос:

```sql
UPDATE gifts
SET reserved_by = $1
WHERE id = $2 AND reserved_by IS NULL;
```

Если `rowCount = 0`, значит подарок уже занят — API возвращает `409`.

## Деплой на Render (Web Service + Postgres)

### 1) Создать Postgres на Render

1. Render Dashboard → **New** → **PostgreSQL**.
2. Выбрать регион/план и создать БД.
3. Скопировать Internal/External Database URL.

### 2) Создать Web Service

1. Render Dashboard → **New** → **Web Service**.
2. Подключить GitHub-репозиторий с этим проектом.
3. Указать:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. В Environment Variables добавить:
   - `DATABASE_URL` = connection string из Render Postgres
   - `NODE_ENV` = `production`
   - `PORT` не обязателен (Render подставляет автоматически)

### 3) Проверка после деплоя

1. Открыть URL сервиса.
2. Проверить `GET /api/gifts`.
3. Забронировать подарок через UI.
4. Перезапустить сервис в Render и убедиться, что бронь сохранилась.

## Измененные файлы

- `src/db.js` — переход на `pg`, инициализация схемы через SQL, сидирование в Postgres.
- `migrations/001_init.sql` — схема таблицы и ограничения.
- `package.json` — удален `sqlite3`, добавлен `pg`.
- `.env.example` — пример env для локального запуска/Render.
- `README.md` — инструкция по Render, build/start команды и шаги деплоя.

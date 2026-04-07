const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to connect to Postgres.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  await pool.query(migrationSql);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM gifts');
  const count = rows[0].total;

  if (count === 0) {
    const gifts = [
      ['Набор LEGO City', '3 990 ₽', 'https://www.ozon.ru/'],
      ['Самокат детский', '5 500 ₽', 'https://www.wildberries.ru/'],
      ['Конструктор магнитный', '2 700 ₽', 'https://www.ozon.ru/'],
      ['Книга «Приключения для детей»', '850 ₽', 'https://www.labirint.ru/'],
      ['Набор фломастеров и скетчбук', '1 200 ₽', 'https://www.detmir.ru/'],
      ['Пазл на 200 деталей', '990 ₽', 'https://www.ozon.ru/'],
      ['Настольная игра для семьи', '1 800 ₽', 'https://www.chitai-gorod.ru/'],
      ['Радиоуправляемая машинка', '4 300 ₽', 'https://www.wildberries.ru/'],
      ['Детский рюкзак', '2 200 ₽', 'https://www.ozon.ru/'],
      ['Набор для опытов', '2 950 ₽', 'https://www.detmir.ru/']
    ];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [name, price, link] of gifts) {
        await client.query(
          'INSERT INTO gifts (name, price, link, reserved_by) VALUES ($1, $2, $3, NULL)',
          [name, price, link]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function getAllGifts() {
  const { rows } = await pool.query('SELECT id, name, price, link, reserved_by FROM gifts ORDER BY id');
  return rows;
}

async function reserveGift(giftId, personName) {
  const { rowCount } = await pool.query(
    'UPDATE gifts SET reserved_by = $1 WHERE id = $2 AND reserved_by IS NULL',
    [personName.trim(), giftId]
  );

  return rowCount > 0;
}

module.exports = {
  initDb,
  getAllGifts,
  reserveGift
};

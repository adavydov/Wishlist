const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Файл базы хранится локально и сохраняет бронирования между перезапусками.
const dbPath = path.join(__dirname, '..', 'data', 'wishlist.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      return resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      return resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      price TEXT NOT NULL CHECK (length(trim(price)) > 0),
      link TEXT NOT NULL CHECK (length(trim(link)) > 0),
      reserved_by TEXT
    )
  `);

  await run(`
    CREATE TRIGGER IF NOT EXISTS prevent_reserved_name_overwrite
    BEFORE UPDATE OF reserved_by ON gifts
    FOR EACH ROW
    WHEN OLD.reserved_by IS NOT NULL
      AND NEW.reserved_by IS NOT NULL
      AND trim(OLD.reserved_by) != trim(NEW.reserved_by)
    BEGIN
      SELECT RAISE(ABORT, 'Gift is already reserved');
    END
  `);

  await run(`
    CREATE TRIGGER IF NOT EXISTS validate_reserved_name
    BEFORE UPDATE OF reserved_by ON gifts
    FOR EACH ROW
    WHEN NEW.reserved_by IS NOT NULL
      AND (length(trim(NEW.reserved_by)) < 2 OR length(trim(NEW.reserved_by)) > 80)
    BEGIN
      SELECT RAISE(ABORT, 'Invalid reserver name length');
    END
  `);

  const countRows = await all('SELECT COUNT(*) AS total FROM gifts');
  const count = countRows[0].total;

  // Заполняем фиксированный список подарков только один раз, если таблица пустая.
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

    for (const gift of gifts) {
      await run('INSERT INTO gifts (name, price, link, reserved_by) VALUES (?, ?, ?, NULL)', gift);
    }
  }
}

function getAllGifts() {
  return all('SELECT id, name, price, link, reserved_by FROM gifts ORDER BY id');
}

async function reserveGift(giftId, personName) {
  // Защита от двойного бронирования: обновляем запись только если reserved_by ещё NULL.
  // Это атомарная операция в SQLite и она корректна при конкурентных запросах.
  const result = await run('UPDATE gifts SET reserved_by = ? WHERE id = ? AND reserved_by IS NULL', [
    personName.trim(),
    giftId
  ]);

  return result.changes > 0;
}

module.exports = {
  initDb,
  getAllGifts,
  reserveGift
};

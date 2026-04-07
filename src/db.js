const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Файл базы хранится локально и сохраняет бронирования между перезапусками.
const dbPath = path.join(__dirname, '..', 'data', 'wishlist.db');
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
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      link TEXT NOT NULL,
      reserved_by TEXT
    )
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
  const result = await run('UPDATE gifts SET reserved_by = ? WHERE id = ? AND reserved_by IS NULL', [
    personName,
    giftId
  ]);

  return result.changes > 0;
}

module.exports = {
  initDb,
  getAllGifts,
  reserveGift
};

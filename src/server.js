const express = require('express');
const path = require('path');
const { initDb, getAllGifts, reserveGift } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/gifts', async (req, res) => {
  try {
    const gifts = await getAllGifts();
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ message: 'Не удалось загрузить список подарков.' });
  }
});

app.post('/api/gifts/:id/book', async (req, res) => {
  const giftId = Number(req.params.id);
  const personName = (req.body.name || '').trim();

  if (!Number.isInteger(giftId) || giftId <= 0) {
    return res.status(400).json({ message: 'Некорректный идентификатор подарка.' });
  }

  if (!personName) {
    return res.status(400).json({ message: 'Введите имя для бронирования.' });
  }

  if (personName.length < MIN_NAME_LENGTH) {
    return res.status(422).json({
      message: `Имя должно содержать минимум ${MIN_NAME_LENGTH} символа.`
    });
  }

  if (personName.length > MAX_NAME_LENGTH) {
    return res.status(422).json({
      message: `Имя слишком длинное. Максимум: ${MAX_NAME_LENGTH} символов.`
    });
  }

  if (!/[\p{L}\p{N}]/u.test(personName)) {
    return res.status(400).json({ message: 'Укажите корректный подарок и имя.' });
  }

  try {
    const success = await reserveGift(giftId, personName);

    if (!success) {
      return res.status(409).json({ message: 'Подарок уже забронирован другим человеком.' });
    }

    return res.json({ message: 'Подарок успешно забронирован.' });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка на сервере при бронировании.' });
  }
});

(async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Wishlist запущен: http://localhost:${PORT}`);
  });
})();

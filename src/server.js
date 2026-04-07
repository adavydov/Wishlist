const express = require('express');
const path = require('path');
const { initDb, getAllGifts, reserveGift } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/gifts', async (req, res) => {
  const gifts = await getAllGifts();
  res.json(gifts);
});

app.post('/api/gifts/:id/book', async (req, res) => {
  const giftId = Number(req.params.id);
  const personName = (req.body.name || '').trim();

  if (!giftId || !personName) {
    return res.status(400).json({ message: 'Укажите корректный подарок и имя.' });
  }

  const success = await reserveGift(giftId, personName);

  if (!success) {
    return res.status(409).json({ message: 'Подарок уже забронирован другим человеком.' });
  }

  return res.json({ message: 'Подарок успешно забронирован.' });
});

(async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Wishlist запущен: http://localhost:${PORT}`);
  });
})();

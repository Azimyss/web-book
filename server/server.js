const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');

// Конфигурация
dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Папка для загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/user', userRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Book Store API' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!' });
});

// Подключение к MongoDB и запуск сервера
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Подключение к MongoDB успешно');
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err.message);
  }); 
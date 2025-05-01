const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Проверяем наличие токена в заголовке Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];
    } 
    // Проверяем наличие токена в URL-параметрах
    else if (req.query.token) {
      token = req.query.token;
    }

    // Если токена нет, возвращаем ошибку
    if (!token) {
      return res.status(401).json({
        message: 'Для доступа требуется авторизация'
      });
    }

    try {
      // Проверяем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получаем пользователя
      req.user = await User.findById(decoded.id);

      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Неверный токен авторизации'
      });
    }
  } catch (error) {
    res.status(401).json({
      message: 'Не авторизован'
    });
  }
};

// Middleware для проверки роли пользователя
const authorize = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        message: `У роли ${req.user.role} нет доступа к этому ресурсу`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
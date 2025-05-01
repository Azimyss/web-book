const express = require('express');
const router = express.Router();
const { register, login, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);

// Защищенные маршруты
router.get('/profile', protect, getUserProfile);
// Дублирующий маршрут для совместимости с клиентом
router.get('/me', protect, getUserProfile);

module.exports = router; 
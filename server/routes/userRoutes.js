const express = require('express');
const router = express.Router();
const { getUserBooks, getUserNotifications, markNotificationAsRead, checkRentals } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Маршруты для обычных пользователей
router.get('/books', protect, getUserBooks);
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/:id', protect, markNotificationAsRead);

// Маршруты для администраторов
router.get('/check-rentals', protect, authorize('admin'), checkRentals);

module.exports = router; 
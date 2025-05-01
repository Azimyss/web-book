const express = require('express');
const router = express.Router();
const { 
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  purchaseBook,
  rentBook,
  readBook
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');

// Публичные маршруты
router.get('/', getBooks);
router.get('/:id', getBookById);

// Маршруты для авторизованных пользователей
router.post('/:id/purchase', protect, purchaseBook);
router.post('/:id/rent', protect, rentBook);
router.get('/:id/read', protect, readBook);

// Маршруты для администраторов
router.post('/', protect, authorize('admin'), uploadPdf, createBook);
router.put('/:id', protect, authorize('admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router; 
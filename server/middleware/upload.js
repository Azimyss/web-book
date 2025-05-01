const multer = require('multer');
const path = require('path');

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Формируем уникальное имя файла
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Фильтр для проверки типа файла (только PDF)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Допустимы только PDF файлы'), false);
  }
};

// Ограничение размера файла (10 МБ)
const limits = {
  fileSize: 10 * 1024 * 1024
};

// Middleware для загрузки PDF-файлов
const uploadPdf = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
}).single('pdf');

// Middleware обработчик
exports.uploadPdf = (req, res, next) => {
  uploadPdf(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Ошибка Multer
      return res.status(400).json({
        success: false,
        message: `Ошибка загрузки файла: ${err.message}`
      });
    } else if (err) {
      // Другие ошибки
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Если файл не был загружен
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, загрузите PDF файл'
      });
    }
    
    // Добавляем путь к файлу в req.body
    req.body.pdfPath = req.file.path;
    
    next();
  });
}; 
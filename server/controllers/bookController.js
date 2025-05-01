const Book = require('../models/Book');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Получение всех книг с возможностью фильтрации
exports.getBooks = async (req, res) => {
  try {
    let query = {};

    // Фильтрация по категории
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Фильтрация по автору
    if (req.query.author) {
      query.author = { $regex: req.query.author, $options: 'i' };
    }

    // Фильтрация по году
    if (req.query.year) {
      query.year = req.query.year;
    }

    // Фильтрация по статусу (только доступные книги)
    if (req.query.onlyAvailable === 'true') {
      query.status = 'available';
    }

    // Получаем книги
    const books = await Book.find(query);

    res.json({
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении книг',
      error: error.message
    });
  }
};

// Получение конкретной книги
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Книга не найдена'
      });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении книги',
      error: error.message
    });
  }
};

// Создание новой книги
exports.createBook = async (req, res) => {
  try {
    // Создаем книгу
    const book = await Book.create(req.body);

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при создании книги',
      error: error.message
    });
  }
};

// Обновление книги
exports.updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Книга не найдена'
      });
    }

    // Обновляем книгу
    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json(book);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при обновлении книги',
      error: error.message
    });
  }
};

// @desc    Удаление книги
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Книга не найдена'
      });
    }

    // Удаляем PDF файл, если он существует
    if (book.pdfPath) {
      const pdfPath = path.join(__dirname, '..', book.pdfPath);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    // Удаляем книгу из базы данных
    await book.remove();

    res.json({
      success: true,
      message: 'Книга успешно удалена'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении книги',
      error: error.message
    });
  }
};

// @desc    Покупка книги
// @route   POST /api/books/:id/purchase
// @access  Private
exports.purchaseBook = async (req, res) => {
  try {
    console.log('Начинаем обработку покупки книги...');
    const book = await Book.findById(req.params.id);
    console.log('ID книги:', req.params.id);
    console.log('Найдена книга:', book ? 'Да' : 'Нет');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Книга не найдена'
      });
    }

    if (book.status === 'unavailable') {
      return res.status(400).json({
        success: false,
        message: 'Книга недоступна для покупки'
      });
    }

    // Проверяем, не куплена ли уже книга
    const user = await User.findById(req.user._id);
    console.log('ID пользователя:', req.user._id);
    console.log('Найден пользователь:', user ? 'Да' : 'Нет');
    console.log('Текущие купленные книги:', user.purchasedBooks);
    
    const isBookAlreadyPurchased = user.purchasedBooks.some(id => id.toString() === book._id.toString());
    console.log('Книга уже куплена:', isBookAlreadyPurchased);

    if (isBookAlreadyPurchased) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже приобрели эту книгу'
      });
    }

    // Добавляем книгу в список купленных
    user.purchasedBooks.push(book._id);
    await user.save();
    console.log('Книга добавлена в список покупок');
    console.log('Обновленные купленные книги:', user.purchasedBooks);

    res.json({
      success: true,
      message: 'Книга успешно приобретена',
      data: {
        book: book,
        purchasePrice: book.price.purchase
      }
    });
  } catch (error) {
    console.error('Ошибка при покупке книги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при покупке книги',
      error: error.message
    });
  }
};

// @desc    Аренда книги
// @route   POST /api/books/:id/rent
// @access  Private
exports.rentBook = async (req, res) => {
  try {
    const { rentalPeriod } = req.body;
    
    // Проверяем период аренды
    if (!['2weeks', '1month', '3months'].includes(rentalPeriod)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный период аренды'
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Книга не найдена'
      });
    }

    if (book.status === 'unavailable') {
      return res.status(400).json({
        success: false,
        message: 'Книга недоступна для аренды'
      });
    }

    // Расчет даты окончания аренды
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (rentalPeriod === '2weeks') {
      endDate.setDate(endDate.getDate() + 14);
    } else if (rentalPeriod === '1month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (rentalPeriod === '3months') {
      endDate.setMonth(endDate.getMonth() + 3);
    }

    // Проверяем, нет ли уже арендованной книги
    const user = await User.findById(req.user._id);
    
    const alreadyRented = user.rentedBooks.some(
      rental => rental.bookId.toString() === book._id.toString()
    );

    if (alreadyRented) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже арендовали эту книгу'
      });
    }

    // Добавляем книгу в список арендованных
    user.rentedBooks.push({
      bookId: book._id,
      endDate: endDate,
      rentalPeriod: rentalPeriod
    });
    
    await user.save();

    // Определяем цену аренды
    let rentalPrice;
    if (rentalPeriod === '2weeks') {
      rentalPrice = book.price.rent2Weeks;
    } else if (rentalPeriod === '1month') {
      rentalPrice = book.price.rent1Month;
    } else {
      rentalPrice = book.price.rent3Months;
    }

    res.json({
      success: true,
      message: 'Книга успешно арендована',
      data: {
        book: book,
        rentalPeriod: rentalPeriod,
        endDate: endDate,
        rentalPrice: rentalPrice
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при аренде книги',
      error: error.message
    });
  }
};

// @desc    Получение PDF файла книги для чтения
// @route   GET /api/books/:id/read
// @access  Private
exports.readBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Книга не найдена'
      });
    }

    const user = await User.findById(req.user._id);

    // Преобразование ID книги в строку для сравнения
    const bookIdStr = book._id.toString();

    // Проверяем, купил ли пользователь книгу
    const isPurchased = user.purchasedBooks && user.purchasedBooks.some(id => 
      id && id.toString() === bookIdStr
    );

    // Проверяем, арендовал ли пользователь книгу и не истек ли срок аренды
    const rentedBook = user.rentedBooks && user.rentedBooks.find(
      rental => rental && rental.bookId && rental.bookId.toString() === bookIdStr
    );
    
    const isRented = rentedBook && new Date(rentedBook.endDate) > new Date();

    console.log(`Книга ID: ${bookIdStr}`);
    console.log(`Пользователь ID: ${user._id}`);
    console.log(`Книга куплена: ${isPurchased}`);
    console.log(`Книга арендована: ${isRented}`);

    if (!isPurchased && !isRented) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет доступа к этой книге'
      });
    }

    // Проверяем, содержит ли путь к PDF слово "uploads"
    let pdfPath;
    if (book.pdfPath.startsWith('uploads/')) {
      // Если путь уже содержит "uploads/", формируем путь без дублирования
      pdfPath = path.join(__dirname, '..', book.pdfPath);
    } else {
      // Иначе добавляем путь к uploads
      pdfPath = path.join(__dirname, '..', 'uploads', book.pdfPath);
    }
    console.log(`Путь к PDF файлу: ${pdfPath}`);
    
    // Проверка существования файла
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF файл не найден по пути: ${pdfPath}`);
      
      // Попробуем альтернативный путь, если файл не найден
      const altPath = path.join(__dirname, '..', 'uploads', path.basename(book.pdfPath));
      console.log(`Пробуем альтернативный путь: ${altPath}`);
      
      if (fs.existsSync(altPath)) {
        pdfPath = altPath;
      } else {
        return res.status(404).json({
          success: false,
          message: 'PDF файл книги не найден'
        });
      }
    }

    // Отправка документа
    res.sendFile(pdfPath);
    
  } catch (error) {
    console.error('Ошибка при получении PDF файла книги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении PDF файла книги',
      error: error.message
    });
  }
}; 
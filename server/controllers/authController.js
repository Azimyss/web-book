const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Генерация JWT токена
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Регистрация пользователя
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем, существует ли пользователь с таким email
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Создаем нового пользователя
    const user = await User.create({
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({
        message: 'Некорректные данные пользователя'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка сервера при регистрации',
      error: error.message
    });
  }
};

// @desc    Авторизация пользователя и получение токена
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверяем наличие пользователя с указанным email
    const user = await User.findOne({ email }).select('+password');

    // Если пользователь существует и пароль совпадает
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({
        message: 'Неверный email или пароль'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка сервера при авторизации',
      error: error.message
    });
  }
};

// @desc    Получение профиля текущего пользователя
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // Находим пользователя и заполняем данные о книгах
    const user = await User.findById(req.user._id)
      .populate({
        path: 'purchasedBooks',
        select: '_id title author coverImageUrl price',
      })
      .populate({
        path: 'rentedBooks.bookId',
        select: '_id title author coverImageUrl price',
      });

    if (user) {
      // Преобразуем структуру для соответствия клиентскому ожиданию
      const formattedRentedBooks = user.rentedBooks.map(rental => {
        return {
          _id: rental.bookId._id,
          title: rental.bookId.title,
          author: rental.bookId.author,
          coverImageUrl: rental.bookId.coverImageUrl,
          endDate: rental.endDate,
          rentalPeriod: rental.rentalPeriod
        };
      });

      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        purchasedBooks: user.purchasedBooks,
        rentedBooks: formattedRentedBooks,
        notifications: user.notifications
      });
    } else {
      res.status(404).json({
        message: 'Пользователь не найден'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка сервера при получении профиля',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getUserProfile
}; 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Пожалуйста, укажите email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, укажите корректный email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста, укажите пароль'],
    minlength: [6, 'Пароль должен содержать минимум 6 символов'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  rentedBooks: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
      },
      endDate: {
        type: Date
      },
      rentalPeriod: {
        type: String,
        enum: ['2weeks', '1month', '3months']
      }
    }
  ],
  purchasedBooks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }
  ],
  notifications: [
    {
      message: String,
      date: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      }
    }
  ]
}, { timestamps: false });

// Хеширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Метод для сравнения паролей
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 
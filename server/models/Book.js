const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Пожалуйста, укажите название книги'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Пожалуйста, укажите автора книги'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Пожалуйста, укажите категорию книги'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Пожалуйста, укажите год написания книги']
  },
  description: {
    type: String,
    required: [true, 'Пожалуйста, добавьте описание книги']
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Пожалуйста, укажите URL обложки книги']
  },
  pdfPath: {
    type: String,
    required: [true, 'Пожалуйста, укажите путь к PDF файлу книги']
  },
  price: {
    purchase: {
      type: Number,
      required: [true, 'Пожалуйста, укажите цену покупки']
    },
    rent2Weeks: {
      type: Number,
      required: [true, 'Пожалуйста, укажите цену аренды на 2 недели']
    },
    rent1Month: {
      type: Number,
      required: [true, 'Пожалуйста, укажите цену аренды на 1 месяц']
    },
    rent3Months: {
      type: Number,
      required: [true, 'Пожалуйста, укажите цену аренды на 3 месяца']
    }
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available'
  }
}, { timestamps: false });

module.exports = mongoose.model('Book', BookSchema); 
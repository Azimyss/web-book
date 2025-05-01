const User = require('../models/User');
const Book = require('../models/Book');

// Получение списка книг пользователя (купленные и арендованные)
const getUserBooks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('purchasedBooks')
      .populate({
        path: 'rentedBooks.bookId',
        model: 'Book'
      });

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    // Форматируем список арендованных книг
    const rentedBooks = user.rentedBooks.map(rental => {
      const book = rental.bookId;
      const endDate = new Date(rental.endDate);
      const isExpired = endDate < new Date();
      const daysLeft = isExpired ? 0 : Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

      return {
        book: book,
        endDate: rental.endDate,
        rentalPeriod: rental.rentalPeriod,
        isExpired: isExpired,
        daysLeft: daysLeft
      };
    });

    res.json({
      purchasedBooks: user.purchasedBooks,
      rentedBooks: rentedBooks
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении книг пользователя',
      error: error.message
    });
  }
};

// Получение уведомлений пользователя
const getUserNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json(user.notifications);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении уведомлений',
      error: error.message
    });
  }
};

// Отметка уведомления как прочитанного
const markNotificationAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const notification = user.notifications.id(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: 'Уведомление не найдено'
      });
    }

    notification.read = true;
    await user.save();

    res.json({
      message: 'Уведомление отмечено как прочитанное',
      notification
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при обновлении уведомления',
      error: error.message
    });
  }
};

// Проверка сроков аренды
const checkRentals = async (req, res) => {
  try {
    const users = await User.find({ 'rentedBooks.0': { $exists: true } });
    
    let notificationsSent = 0;
    const currentDate = new Date();
    
    // Проходим по каждому пользователю и проверяем сроки аренды книг
    for (const user of users) {
      for (const rental of user.rentedBooks) {
        const endDate = new Date(rental.endDate);
        
        // Проверяем, истекает ли срок аренды в течение 3 дней
        const daysUntilExpiration = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
          // Получаем информацию о книге
          const book = await Book.findById(rental.bookId);
          
          if (book) {
            // Проверяем, нет ли уже уведомления об истечении срока для этой книги
            const existingNotification = user.notifications.find(
              n => n.message.includes(book.title) && n.message.includes('истекает')
            );
            
            if (!existingNotification) {
              // Добавляем уведомление
              user.notifications.push({
                message: `Срок аренды книги "${book.title}" истекает через ${daysUntilExpiration} дней (${endDate.toLocaleDateString()}).`,
                date: new Date(),
                read: false
              });
              
              notificationsSent++;
            }
          }
        } 
        // Проверяем, истек ли срок аренды
        else if (endDate < currentDate) {
          // Получаем информацию о книге
          const book = await Book.findById(rental.bookId);
          
          if (book) {
            // Проверяем, нет ли уже уведомления об истечении срока для этой книги
            const existingNotification = user.notifications.find(
              n => n.message.includes(book.title) && n.message.includes('истек')
            );
            
            if (!existingNotification) {
              // Добавляем уведомление
              user.notifications.push({
                message: `Срок аренды книги "${book.title}" истек ${endDate.toLocaleDateString()}.`,
                date: new Date(),
                read: false
              });
              
              notificationsSent++;
            }
          }
        }
      }
      
      // Сохраняем изменения в пользователе
      await user.save();
    }
    
    res.json({
      message: `Проверка сроков аренды завершена. Отправлено ${notificationsSent} уведомлений.`
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при проверке сроков аренды',
      error: error.message
    });
  }
};

module.exports = {
  getUserBooks,
  getUserNotifications,
  markNotificationAsRead,
  checkRentals
}; 
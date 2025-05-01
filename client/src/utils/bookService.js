import api from './api';
import { toast } from 'react-toastify';

// Функция для покупки книги
export const purchaseBook = async (bookId, userId) => {
  try {
    // В реальном приложении здесь был бы запрос к API
    // const response = await axios.post(`/api/books/${bookId}/purchase`);
    
    // Для учебного проекта - имитация процесса покупки
    // Сохраняем информацию в localStorage
    const purchasedBooks = JSON.parse(localStorage.getItem('purchasedBooks') || '[]');
    
    // Проверяем, не куплена ли уже книга
    if (purchasedBooks.some(item => item.bookId === bookId)) {
      toast.info('Вы уже купили эту книгу');
      return { success: true, message: 'Книга уже куплена' };
    }
    
    // Добавляем книгу в список купленных
    purchasedBooks.push({
      bookId,
      userId,
      purchaseDate: new Date().toISOString()
    });
    
    localStorage.setItem('purchasedBooks', JSON.stringify(purchasedBooks));
    toast.success('Книга успешно куплена!');
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при покупке книги:', error);
    toast.error(error.response?.data?.message || 'Ошибка при покупке книги');
    return { success: false, error };
  }
};

// Функция для аренды книги
export const rentBook = async (bookId, userId, rentalPeriod) => {
  try {
    // В реальном приложении здесь был бы запрос к API
    // const response = await axios.post(`/api/books/${bookId}/rent`, { rentalPeriod });
    
    // Определяем срок окончания аренды в зависимости от выбранного периода
    let endDate = new Date();
    
    switch (rentalPeriod) {
      case '2weeks':
        endDate.setDate(endDate.getDate() + 14);
        break;
      case '1month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      default:
        throw new Error('Неверный период аренды');
    }
    
    // Сохраняем информацию в localStorage
    const rentedBooks = JSON.parse(localStorage.getItem('rentedBooks') || '[]');
    
    // Проверяем, не арендована ли уже книга
    const existingRental = rentedBooks.find(item => item.bookId === bookId);
    if (existingRental) {
      // Если книга уже арендована, продлеваем срок
      existingRental.endDate = endDate.toISOString();
      existingRental.rentalPeriod = rentalPeriod;
      localStorage.setItem('rentedBooks', JSON.stringify(rentedBooks));
      toast.success('Срок аренды книги успешно продлен!');
      return { success: true, message: 'Срок аренды продлен' };
    }
    
    // Добавляем книгу в список арендованных
    rentedBooks.push({
      bookId,
      userId,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      rentalPeriod,
      status: 'active'
    });
    
    localStorage.setItem('rentedBooks', JSON.stringify(rentedBooks));
    toast.success('Книга успешно арендована!');
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при аренде книги:', error);
    toast.error(error.response?.data?.message || 'Ошибка при аренде книги');
    return { success: false, error };
  }
};

// Функция для получения списка купленных книг
export const getPurchasedBooks = (userId) => {
  try {
    const purchasedBooks = JSON.parse(localStorage.getItem('purchasedBooks') || '[]');
    // Фильтруем по userId, если он передан
    return userId ? purchasedBooks.filter(item => item.userId === userId) : purchasedBooks;
  } catch (error) {
    console.error('Ошибка при получении списка купленных книг:', error);
    return [];
  }
};

// Функция для получения списка арендованных книг
export const getRentedBooks = (userId) => {
  try {
    const rentedBooks = JSON.parse(localStorage.getItem('rentedBooks') || '[]');
    // Фильтруем по userId, если он передан
    return userId ? rentedBooks.filter(item => item.userId === userId) : rentedBooks;
  } catch (error) {
    console.error('Ошибка при получении списка арендованных книг:', error);
    return [];
  }
};

// Функция для проверки, куплена ли книга пользователем
export const isBookPurchased = (bookId, userId) => {
  try {
    const purchasedBooks = getPurchasedBooks(userId);
    return purchasedBooks.some(item => item.bookId === bookId);
  } catch (error) {
    console.error('Ошибка при проверке покупки книги:', error);
    return false;
  }
};

// Функция для проверки, арендована ли книга пользователем
export const isBookRented = (bookId, userId) => {
  try {
    const rentedBooks = getRentedBooks(userId);
    const rental = rentedBooks.find(item => item.bookId === bookId);
    
    if (!rental) return false;
    
    // Проверяем, не истек ли срок аренды
    if (new Date(rental.endDate) < new Date()) {
      // Срок аренды истек, обновляем статус
      updateRentalStatus(bookId, userId, 'expired');
      return false;
    }
    
    return rental.status === 'active';
  } catch (error) {
    console.error('Ошибка при проверке аренды книги:', error);
    return false;
  }
};

// Функция для обновления статуса аренды
export const updateRentalStatus = (bookId, userId, status) => {
  try {
    const rentedBooks = JSON.parse(localStorage.getItem('rentedBooks') || '[]');
    const updatedRentals = rentedBooks.map(item => {
      if (item.bookId === bookId && (!userId || item.userId === userId)) {
        return { ...item, status };
      }
      return item;
    });
    
    localStorage.setItem('rentedBooks', JSON.stringify(updatedRentals));
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении статуса аренды:', error);
    return false;
  }
};

// Функция для проверки сроков аренды
export const checkRentalExpirations = (userId) => {
  try {
    const rentedBooks = getRentedBooks(userId);
    const now = new Date();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 дня в миллисекундах
    const notifications = [];
    
    rentedBooks.forEach(rental => {
      const endDate = new Date(rental.endDate);
      
      // Если срок аренды истек
      if (endDate < now && rental.status === 'active') {
        updateRentalStatus(rental.bookId, userId, 'expired');
        notifications.push({
          bookId: rental.bookId,
          message: 'Срок аренды книги истек',
          date: new Date().toISOString(),
          read: false,
          type: 'danger'
        });
      }
      // Если срок аренды истекает в течение 3 дней
      else if (endDate - now < threeDaysMs && endDate > now && rental.status === 'active') {
        const daysLeft = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
        notifications.push({
          bookId: rental.bookId,
          message: `Срок аренды книги истекает через ${daysLeft} ${getDaysWord(daysLeft)}`,
          date: new Date().toISOString(),
          read: false,
          type: 'warning'
        });
      }
    });
    
    // Сохраняем уведомления
    if (notifications.length > 0) {
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const newNotifications = [...existingNotifications, ...notifications];
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
    }
    
    return notifications;
  } catch (error) {
    console.error('Ошибка при проверке сроков аренды:', error);
    return [];
  }
};

// Вспомогательная функция для склонения слова "день"
function getDaysWord(days) {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
  return 'дней';
}

// Функция для получения уведомлений пользователя
export const getUserNotifications = (userId) => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return userId ? notifications.filter(item => item.userId === userId) : notifications;
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    return [];
  }
};

// Функция для отметки уведомления как прочитанного
export const markNotificationAsRead = (notificationId) => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = notifications.map(item => {
      if (item.id === notificationId) {
        return { ...item, read: true };
      }
      return item;
    });
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error('Ошибка при отметке уведомления:', error);
    return false;
  }
}; 
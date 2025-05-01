import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserIcon,
  BookOpenIcon,
  ClockIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ProfilePage = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return 'Неверная дата';
    }
  };
  
  // Проверка авторизации
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile');
      return;
    }
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Запрос данных пользователя
        const response = await api.get('/api/auth/me');
        
        // Если получен успешный ответ, устанавливаем данные профиля
        // В случае необходимости преобразуем даты строк в объекты Date
        const profileData = response.data;
        
        // Преобразуем строковые даты в объекты Date для удобства форматирования
        if (profileData.purchasedBooks) {
          profileData.purchasedBooks.forEach(book => {
            if (book.purchaseDate) {
              book.purchaseDate = new Date(book.purchaseDate);
            }
          });
        }
        
        if (profileData.rentedBooks) {
          profileData.rentedBooks.forEach(book => {
            if (book.rentDate) book.rentDate = new Date(book.rentDate);
            if (book.endDate) {
              book.endDate = new Date(book.endDate);
              // Отмечаем истекшие аренды
              book.expired = book.endDate < new Date();
            }
          });
        }
        
        if (profileData.notifications) {
          profileData.notifications.forEach(notification => {
            if (notification.date) notification.date = new Date(notification.date);
          });
        }
        
        setProfile(profileData);
        
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err);
        
        // Проверяем, является ли ошибка проблемой с авторизацией
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // Если это ошибка авторизации, перенаправляем на страницу входа
          navigate('/login?redirect=/profile');
          return;
        }
        
        setError('Не удалось загрузить информацию о профиле.');
        toast.error('Не удалось загрузить информацию о профиле. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user, navigate]);
  
  // Проверка на приближающиеся окончания сроков аренды
  useEffect(() => {
    if (!profile || !profile.rentedBooks || profile.rentedBooks.length === 0) {
      return;
    }

    // Получаем текущую дату
    const currentDate = new Date();
    
    // Добавляем 3 дня к текущей дате для проверки близких к истечению аренд
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 3);
    
    // Фильтруем книги, у которых срок аренды заканчивается в ближайшие 3 дня
    const expiringBooks = profile.rentedBooks.filter(book => {
      if (!book.endDate || book.expired) return false;
      return book.endDate <= warningDate && book.endDate > currentDate;
    });
    
    // Показываем уведомления для книг с истекающим сроком аренды
    expiringBooks.forEach(book => {
      const daysLeft = Math.ceil((book.endDate - currentDate) / (1000 * 60 * 60 * 24));
      const daysText = daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней';
      
      toast.warn(
        <div>
          <p className="font-medium">Срок аренды скоро истекает!</p>
          <p className="text-sm">Книга "{book.title}" будет доступна еще {daysLeft} {daysText}.</p>
        </div>,
        {
          autoClose: 10000, // 10 секунд
          icon: <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />
        }
      );
    });
    
  }, [profile]);
  
  const markNotificationAsRead = async (notificationId) => {
    try {
      // Отмечаем уведомление как прочитанное
      await api.put(`/api/notifications/${notificationId}`, { read: true });
      
      // Обновляем состояние локально
      setProfile(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      }));
      
      toast.info('Уведомление отмечено как прочитанное');
    } catch (err) {
      console.error('Ошибка при отметке уведомления как прочитанного:', err);
      toast.error('Не удалось отметить уведомление как прочитанное');
    }
  };
  
  // Извлекаем непрочитанные уведомления
  const unreadNotificationsCount = profile?.notifications?.filter(n => !n.read).length || 0;
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Ошибка! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Профиль не найден</h2>
          <p className="mt-2 text-gray-500">Не удалось загрузить информацию о профиле.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Мой профиль</h1>
      
      {/* Вкладки профиля */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <Link
            to="/profile"
            className={`pb-4 px-1 ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary-500 text-primary-600 font-medium'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              <span>Профиль</span>
            </div>
          </Link>
          <Link
            to="/profile?tab=purchased"
            className={`pb-4 px-1 ${
              activeTab === 'purchased'
                ? 'border-b-2 border-primary-500 text-primary-600 font-medium'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              <span>Купленные книги{' '}
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {profile.purchasedBooks.length}
                </span>
              </span>
            </div>
          </Link>
          <Link
            to="/profile?tab=rented"
            className={`pb-4 px-1 ${
              activeTab === 'rented'
                ? 'border-b-2 border-primary-500 text-primary-600 font-medium'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Арендованные книги{' '}
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {profile.rentedBooks.length}
                </span>
              </span>
            </div>
          </Link>
          <Link
            to="/profile?tab=notifications"
            className={`pb-4 px-1 ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary-500 text-primary-600 font-medium'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              <span>Уведомления{' '}
                {unreadNotificationsCount > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </span>
            </div>
          </Link>
        </nav>
      </div>
      
      {/* Содержимое вкладки */}
      {activeTab === 'profile' && (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Информация о профиле</h2>
            <div className="border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Тип аккаунта</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Количество книг</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.purchasedBooks.length} купленных, {profile.rentedBooks.length} арендованных
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'purchased' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Мои купленные книги</h2>
          
          {profile.purchasedBooks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">У вас пока нет купленных книг</h3>
              <p className="mt-1 text-sm text-gray-500">
                Перейдите в каталог, чтобы найти интересные книги для покупки
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Перейти в каталог
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.purchasedBooks.map((book) => (
                <div key={book._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                  <Link to={`/books/${book._id}`}>
                    <img 
                      src={book.coverImageUrl} 
                      alt={book.title} 
                      className="w-full h-56 object-cover"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium mb-1">
                      <Link to={`/books/${book._id}`} className="hover:text-primary-600">
                        {book.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Куплена: {formatDate(book.purchaseDate)}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <Link
                        to={`/books/${book._id}/read`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Читать
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'rented' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Мои арендованные книги</h2>
          
          {profile.rentedBooks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">У вас пока нет арендованных книг</h3>
              <p className="mt-1 text-sm text-gray-500">
                Перейдите в каталог, чтобы найти интересные книги для аренды
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Перейти в каталог
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.rentedBooks.map((book) => (
                <div 
                  key={book._id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${
                    book.expired ? 'border-red-300 border' : ''
                  }`}
                >
                  <Link to={`/books/${book._id}`}>
                    <img 
                      src={book.coverImageUrl} 
                      alt={book.title} 
                      className={`w-full h-56 object-cover ${book.expired ? 'opacity-60' : ''}`}
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium mb-1">
                      <Link to={`/books/${book._id}`} className="hover:text-primary-600">
                        {book.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                    
                    {book.expired ? (
                      <div className="text-red-600 text-sm font-medium mb-2 flex items-center">
                        <span className="mr-1">Срок аренды истек</span>
                      </div>
                    ) : (
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">
                          Срок аренды: до {formatDate(book.endDate)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-4">
                      {book.rentalPeriod === '2weeks' ? 'Арендовано на 2 недели' :
                       book.rentalPeriod === '1month' ? 'Арендовано на 1 месяц' :
                       book.rentalPeriod === '3months' ? 'Арендовано на 3 месяца' : ''}
                    </div>
                    
                    <div className="mt-auto flex justify-between items-center">
                      {book.expired ? (
                        <Link
                          to={`/books/${book._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Продлить
                        </Link>
                      ) : (
                        <Link
                          to={`/books/${book._id}/read`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Читать
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'notifications' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Уведомления</h2>
          
          {profile.notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">У вас пока нет уведомлений</h3>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {profile.notifications.map((notification) => (
                  <li 
                    key={notification._id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          <BellIcon className={`h-5 w-5 ${!notification.read ? 'text-primary-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.date)} {notification.date?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification._id)}
                          className="ml-2 flex-shrink-0 bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <span className="sr-only">Отметить как прочитанное</span>
                          <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 
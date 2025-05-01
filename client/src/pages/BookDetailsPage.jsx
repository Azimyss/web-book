import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpenIcon, 
  ShoppingCartIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../utils/api';

const BookDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRentOption, setSelectedRentOption] = useState(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isProcessingRental, setIsProcessingRental] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'purchase' или 'rent'
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [alreadyRented, setAlreadyRented] = useState(false);
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        
        // Получаем информацию о книге
        const response = await api.get(`/api/books/${id}`);
        setBook(response.data);
        
        // Проверяем доступность книги для аутентифицированного пользователя
        if (user && user._id) {
          try {
            // Получаем данные профиля, чтобы узнать, куплена ли книга
            const profileResponse = await api.get('/api/auth/me');
            
            // Проверяем, куплена ли книга
            const isPurchased = profileResponse.data.purchasedBooks && 
              profileResponse.data.purchasedBooks.some(book => book._id === id);
            setAlreadyPurchased(isPurchased);
            
            // Проверяем, арендована ли книга
            const isRented = profileResponse.data.rentedBooks && 
              profileResponse.data.rentedBooks.some(book => book._id === id);
            setAlreadyRented(isRented);
          } catch (err) {
            console.error('Ошибка при проверке статуса книги:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке книги:', err);
        setError('Не удалось загрузить информацию о книге. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [id, user]);

  // Обработчик выбора периода аренды
  const handleRentOptionSelect = (option) => {
    setSelectedRentOption(option);
  };

  // Открытие модального окна оплаты
  const openPaymentModal = (type) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/books/${id}`)}`);
      return;
    }
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  // Отмена оплаты
  const cancelPayment = () => {
    setShowPaymentModal(false);
    setPaymentType(null);
  };

  // Имитация процесса оплаты
  const processPayment = async () => {
    try {
      if (paymentType === 'purchase') {
        setIsProcessingPurchase(true);
        
        // Используем API для покупки книги на сервере
        const response = await api.post(`/api/books/${id}/purchase`);
        
        if (response.data.success) {
          // После успешной покупки перенаправляем на страницу чтения
          setShowPaymentModal(false);
          setAlreadyPurchased(true);
          toast.success('Книга успешно приобретена!');
          navigate(`/books/${id}/read`);
        } else {
          throw new Error(response.data.message || 'Ошибка при покупке книги');
        }
      } else if (paymentType === 'rent') {
        if (!selectedRentOption) {
          toast.warning('Пожалуйста, выберите период аренды');
          setShowPaymentModal(false);
          return;
        }
        
        setIsProcessingRental(true);
        
        // Используем API для аренды книги на сервере
        const response = await api.post(`/api/books/${id}/rent`, {
          rentalPeriod: selectedRentOption
        });
        
        if (response.data.success) {
          // Определяем текстовое представление периода аренды для уведомления
          const rentalPeriodText = rentalOptions.find(o => o.id === selectedRentOption)?.label.toLowerCase();
          
          // После успешной аренды перенаправляем на страницу чтения
          setShowPaymentModal(false);
          setAlreadyRented(true);
          toast.success(`Книга успешно арендована на ${rentalPeriodText}!`);
          navigate(`/books/${id}/read`);
        } else {
          throw new Error(response.data.message || 'Ошибка при аренде книги');
        }
      }
    } catch (err) {
      console.error('Ошибка при обработке платежа:', err);
      setShowPaymentModal(false);
      
      // Проверяем, есть ли понятное сообщение об ошибке в ответе
      const errorMessage = 
        err.response?.data?.message || err.message || 
        'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте позже.';
      
      toast.error(errorMessage);
    } finally {
      setIsProcessingPurchase(false);
      setIsProcessingRental(false);
    }
  };
  
  const rentalOptions = [
    { id: '2weeks', label: '2 недели', price: book?.price?.rent2Weeks },
    { id: '1month', label: '1 месяц', price: book?.price?.rent1Month },
    { id: '3months', label: '3 месяца', price: book?.price?.rent3Months },
  ];
  
  const openPdfInNewWindow = () => {
    // Получаем токен из localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Требуется авторизация для чтения книги');
      return;
    }
    
    // Создаем URL для PDF с токеном
    const pdfUrl = `/api/books/${id}/read?token=${token}`;
    
    // Открываем PDF в новом окне
    window.open(pdfUrl, '_blank');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Ошибка! </strong>
        <span className="block sm:inline">{error}</span>
        <p className="mt-2">
          <Link to="/" className="text-red-700 underline">Вернуться на главную</Link>
        </p>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">Книга не найдена</h2>
        <p className="mt-2 text-gray-500">Запрашиваемая книга не существует или была удалена.</p>
        <Link to="/" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
          Вернуться к списку книг
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Навигационные хлебные крошки */}
      <nav className="mb-6">
        <ol className="flex text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600">Главная</Link>
          </li>
          <li className="mx-2">/</li>
          <li>
            <Link to={`/?category=${encodeURIComponent(book.category)}`} className="hover:text-primary-600">
              {book.category}
            </Link>
          </li>
          <li className="mx-2">/</li>
          <li className="text-gray-700 font-medium">{book.title}</li>
        </ol>
      </nav>

      {/* Основная информация о книге */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Обложка книги */}
        <div className="md:w-1/3">
          <img 
            src={book.coverImageUrl} 
            alt={book.title} 
            className="w-full rounded-lg shadow-md"
          />
        </div>
        
        {/* Детали книги */}
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{book.author}</p>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Год: {book.year}</p>
            <p className="text-sm text-gray-500 mb-1">Категория: {book.category}</p>
          </div>
          
          {/* Блок покупки и аренды */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Приобрести книгу</h2>
              {alreadyPurchased ? (
                <div className="bg-green-100 text-green-800 p-3 rounded-md mb-3">
                  <p className="font-medium">Вы уже приобрели эту книгу!</p>
                  <button
                    onClick={() => openPdfInNewWindow()}
                    className="inline-flex items-center mt-2 text-sm font-medium text-green-700 hover:text-green-900"
                  >
                    <BookOpenIcon className="h-5 w-5 mr-1" />
                    Читать книгу
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold">{book.price.purchase} ₽</div>
                  <button
                    onClick={() => openPaymentModal('purchase')}
                    disabled={isProcessingPurchase}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPurchase ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Обработка...
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="h-5 w-5 mr-2" />
                        Купить
                      </>
                    )}
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-600">Постоянный доступ к книге</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                {alreadyRented ? "Продлить аренду:" : "Или арендовать на время:"}
              </h3>
              {alreadyRented && (
                <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-3">
                  <p className="font-medium">У вас уже есть активная аренда этой книги!</p>
                  <button
                    onClick={() => openPdfInNewWindow()}
                    className="inline-flex items-center mt-2 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    <BookOpenIcon className="h-5 w-5 mr-1" />
                    Читать книгу
                  </button>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {rentalOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`py-2 px-3 text-sm font-medium rounded-md ${
                      selectedRentOption === option.id
                        ? 'bg-primary-100 text-primary-800 border-primary-500 border'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleRentOptionSelect(option.id)}
                    disabled={isProcessingRental}
                  >
                    <div>{option.label}</div>
                    <div className="font-bold">{option.price} ₽</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => openPaymentModal('rent')}
                disabled={!selectedRentOption || isProcessingRental}
                className="w-full py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingRental ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Обработка...
                  </>
                ) : (
                  alreadyRented ? 'Продлить аренду' : 'Арендовать'
                )}
              </button>
            </div>
          </div>
          
          {/* Описание книги */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Описание</h2>
            <div className="text-gray-700 space-y-4">
              {book.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно оплаты */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {paymentType === 'purchase' ? 'Покупка книги' : 'Аренда книги'}
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Название: <span className="font-medium">{book.title}</span></p>
              <p className="text-gray-700 mb-2">Автор: <span className="font-medium">{book.author}</span></p>
              <p className="text-gray-700 mb-4">
                Сумма к оплате: <span className="font-bold">
                  {paymentType === 'purchase' 
                    ? `${book.price.purchase} ₽` 
                    : `${rentalOptions.find(o => o.id === selectedRentOption)?.price} ₽`}
                </span>
              </p>
              <p className="text-gray-700 mb-4">
                {paymentType === 'rent' && `Период аренды: ${rentalOptions.find(o => o.id === selectedRentOption)?.label}`}
              </p>
              <div className="mt-6 bg-gray-50 p-4 rounded-md text-sm text-gray-600">
                Это демонстрационная версия оплаты. В реальном приложении здесь была бы форма для ввода данных карты.
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelPayment}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={processPayment}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailsPage; 
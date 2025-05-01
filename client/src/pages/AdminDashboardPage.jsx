import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { 
  BookOpenIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { toast } from 'react-toastify';

// Компоненты для маршрутизации внутри админ-панели
const BooksList = ({ books, loading, error, handleDeleteBook, handleChangeStatus }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Каталог книг</h2>
        <Link 
          to="/admin/books/add"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить книгу
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Ошибка! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">Нет доступных книг</h3>
          <p className="mt-2 text-gray-500">Начните с добавления новой книги в каталог.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена (₽)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded object-cover" src={book.coverImageUrl} alt={book.title} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-500">Год: {book.year}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.price.purchase}</div>
                    <div className="text-xs text-gray-500">
                      Аренда: {book.price.rent2Weeks} / {book.price.rent1Month} / {book.price.rent3Months}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        book.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {book.status === 'available' ? 'Доступна' : 'Недоступна'}
                    </span>
                    <button 
                      onClick={() => handleChangeStatus(book._id, book.status === 'available' ? 'unavailable' : 'available')}
                      className="ml-2 text-xs text-primary-600 hover:text-primary-900"
                    >
                      {book.status === 'available' ? 'Деактивировать' : 'Активировать'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      to={`/admin/books/edit/${book._id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteBook(book._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BookForm = ({ type = 'add', bookId = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    year: new Date().getFullYear(),
    description: '',
    coverImageUrl: '',
    pdfUrl: '',
    price: {
      purchase: 0,
      rent2Weeks: 0,
      rent1Month: 0,
      rent3Months: 0
    },
    status: 'available'
  });
  
  // Если редактирование - загрузка данных книги
  useEffect(() => {
    if (type === 'edit' && bookId) {
      const fetchBook = async () => {
        try {
          setLoading(true);
          
          // Получаем данные книги от API
          const response = await api.get(`/api/books/${bookId}`);
          setFormData(response.data);
          setLoading(false);
          
        } catch (err) {
          console.error('Ошибка при загрузке книги:', err);
          setError('Не удалось загрузить информацию о книге.');
          setLoading(false);
        }
      };
      
      fetchBook();
    }
  }, [type, bookId]);
  
  // Обработка изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('price.')) {
      const priceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        price: {
          ...prev.price,
          [priceField]: Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (type === 'add') {
        // Создаем новую книгу
        await api.post('/api/books', formData);
      } else {
        // Обновляем существующую книгу
        await api.put(`/api/books/${bookId}`, formData);
      }
      
      // Перенаправление на список книг
      navigate('/admin/books');
      
    } catch (err) {
      console.error('Ошибка при сохранении книги:', err);
      setError('Произошла ошибка при сохранении книги. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && type === 'edit') {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'add' ? 'Добавление новой книги' : 'Редактирование книги'}
        </h2>
        <Link 
          to="/admin/books"
          className="text-gray-600 hover:text-gray-900"
        >
          Вернуться к списку
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Ошибка! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Название книги
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Автор
            </label>
            <input
              type="text"
              name="author"
              id="author"
              value={formData.author}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Категория
            </label>
            <input
              type="text"
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Год издания
            </label>
            <input
              type="number"
              name="year"
              id="year"
              value={formData.year}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700">
              URL обложки
            </label>
            <input
              type="url"
              name="coverImageUrl"
              id="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
            {formData.coverImageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.coverImageUrl} 
                  alt="Предпросмотр обложки" 
                  className="h-32 object-cover rounded-md" 
                />
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="pdfUrl" className="block text-sm font-medium text-gray-700">
              URL PDF-файла
            </label>
            <input
              type="url"
              name="pdfUrl"
              id="pdfUrl"
              value={formData.pdfUrl}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price.purchase" className="block text-sm font-medium text-gray-700">
              Цена покупки (₽)
            </label>
            <input
              type="number"
              name="price.purchase"
              id="price.purchase"
              value={formData.price.purchase}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="available">Доступна</option>
              <option value="unavailable">Недоступна</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Цены аренды</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="price.rent2Weeks" className="block text-sm font-medium text-gray-700">
                  2 недели (₽)
                </label>
                <input
                  type="number"
                  name="price.rent2Weeks"
                  id="price.rent2Weeks"
                  value={formData.price.rent2Weeks}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="price.rent1Month" className="block text-sm font-medium text-gray-700">
                  1 месяц (₽)
                </label>
                <input
                  type="number"
                  name="price.rent1Month"
                  id="price.rent1Month"
                  value={formData.price.rent1Month}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="price.rent3Months" className="block text-sm font-medium text-gray-700">
                  3 месяца (₽)
                </label>
                <input
                  type="number"
                  name="price.rent3Months"
                  id="price.rent3Months"
                  value={formData.price.rent3Months}
                  onChange={handleChange}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Link
            to="/admin/books"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение...
              </>
            ) : (
              'Сохранить книгу'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminDashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Проверка прав доступа
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login?redirect=/admin');
      return;
    }
    
    // Загрузка книг для админ-панели
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        // Получаем список книг от API
        const response = await api.get('/api/books');
        // Устанавливаем books из поля data в ответе API
        setBooks(response.data.data || []);
        setLoading(false);
        
      } catch (err) {
        console.error('Ошибка при загрузке книг:', err);
        setError('Не удалось загрузить список книг. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, [user, navigate]);
  
  // Удаление книги
  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      return;
    }
    
    try {
      // Отправляем запрос на удаление книги
      await api.delete(`/api/books/${bookId}`);
      
      // Обновляем список книг
      setBooks(books.filter(book => book._id !== bookId));
      
      toast.success('Книга успешно удалена');
      
    } catch (err) {
      console.error('Ошибка при удалении книги:', err);
      toast.error('Произошла ошибка при удалении книги. Пожалуйста, попробуйте позже.');
    }
  };
  
  // Изменение статуса книги
  const handleChangeStatus = async (bookId, newStatus) => {
    try {
      // Отправляем запрос на обновление книги
      await api.put(`/api/books/${bookId}`, { status: newStatus });
      
      // Обновляем список книг
      setBooks(books.map(book => 
        book._id === bookId ? { ...book, status: newStatus } : book
      ));
      
      toast.success(`Статус книги изменен на: ${newStatus === 'available' ? 'Доступна' : 'Недоступна'}`);
      
    } catch (err) {
      console.error('Ошибка при изменении статуса книги:', err);
      toast.error('Произошла ошибка при изменении статуса книги. Пожалуйста, попробуйте позже.');
    }
  };
  
  // Получение ID книги из URL для редактирования
  const getBookIdFromPath = () => {
    const parts = location.pathname.split('/');
    return parts[parts.length - 1];
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>
      
      <Routes>
        <Route 
          path="/" 
          element={<BooksList 
            books={books}
            loading={loading}
            error={error}
            handleDeleteBook={handleDeleteBook}
            handleChangeStatus={handleChangeStatus}
          />} 
        />
        <Route path="/books" element={
          <BooksList 
            books={books}
            loading={loading}
            error={error}
            handleDeleteBook={handleDeleteBook}
            handleChangeStatus={handleChangeStatus}
          />
        } />
        <Route path="/books/add" element={<BookForm type="add" />} />
        <Route path="/books/edit/:id" element={<BookForm type="edit" bookId={getBookIdFromPath()} />} />
      </Routes>
    </div>
  );
};

export default AdminDashboardPage; 
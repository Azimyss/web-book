import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { StarIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const BookCard = ({ book }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link to={`/books/${book._id}`}>
        <div className="aspect-[2/3] w-full relative">
          <img 
            src={book.coverImageUrl} 
            alt={book.title}
            className="w-full h-full object-cover" 
          />
          {book.status !== 'available' && (
            <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs">
              Недоступна
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{book.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{book.author}</p>
          
          <div className="flex items-center mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon 
                  key={i}
                  className={`h-4 w-4 ${i < (book.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({book.reviewsCount || 0})</span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-primary-600 font-semibold">{book.price.purchase} ₽</p>
            <p className="text-xs text-gray-500">Аренда: от {book.price.rent2Weeks} ₽</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

const GenresList = ({ genres, setSelectedGenre, selectedGenre }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Жанры</h2>
      <div className="space-y-2">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`w-full text-left px-3 py-2 rounded-md transition ${
            selectedGenre === null 
              ? 'bg-primary-100 text-primary-800 font-medium' 
              : 'hover:bg-gray-100'
          }`}
        >
          Все жанры
        </button>
        
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre.id)}
            className={`w-full text-left px-3 py-2 rounded-md transition ${
              selectedGenre === genre.id 
                ? 'bg-primary-100 text-primary-800 font-medium' 
                : 'hover:bg-gray-100'
            }`}
          >
            {genre.name}
            <span className="text-gray-400 ml-2">({genre.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title'); // Сортировка по умолчанию по названию
  const [authors, setAuthors] = useState([]); // Список авторов для фильтрации
  const [selectedAuthor, setSelectedAuthor] = useState(null); // Выбранный автор
  const [years, setYears] = useState([]); // Список годов для фильтрации
  const [selectedYear, setSelectedYear] = useState(null); // Выбранный год
  const [showSortDropdown, setShowSortDropdown] = useState(false); // Состояние для отображения выпадающего меню сортировки
  
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        // Реальный API-запрос к серверу с параметрами фильтрации
        const response = await api.get('/api/books', {
          params: { 
            category: selectedGenre ? genreName(selectedGenre) : undefined,
            author: selectedAuthor || undefined,
            year: selectedYear || undefined,
            // Можно добавить параметр для поиска, если бэкенд поддерживает
            // search: searchQuery ? searchQuery : undefined
          }
        });
        
        // Получаем книги из ответа сервера
        const booksData = response.data.data || [];
        
        // Фильтрация книг по поисковому запросу на клиенте
        // (если сервер не поддерживает поиск)
        let filteredBooks = booksData;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().includes(query)
          );
        }
        
        // Сортировка книг на клиенте
        const sortedBooks = [...filteredBooks].sort((a, b) => {
          switch (sortBy) {
            case 'title':
              return a.title.localeCompare(b.title);
            case 'author':
              return a.author.localeCompare(b.author);
            case 'year':
              return a.year - b.year;
            case 'year-desc':
              return b.year - a.year;
            case 'price':
              return a.price.purchase - b.price.purchase;
            case 'price-desc':
              return b.price.purchase - a.price.purchase;
            default:
              return a.title.localeCompare(b.title);
          }
        });
        
        setBooks(sortedBooks);
        
        // Для карусели рекомендованных книг берем первые 3
        setFeaturedBooks(booksData.slice(0, 3));
        setLoading(false);
        
      } catch (err) {
        console.error('Ошибка при загрузке книг:', err);
        setError('Не удалось загрузить список книг. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, [selectedGenre, selectedAuthor, selectedYear, searchQuery, sortBy]);
  
  // Подсчет жанров на основе загруженных книг
  useEffect(() => {
    if (books.length) {
      // Генерируем список жанров
      const genresMap = {};
      
      books.forEach(book => {
        if (!genresMap[book.category]) {
          genresMap[book.category] = {
            id: Object.keys(genresMap).length + 1,
            name: book.category,
            count: 1
          };
        } else {
          genresMap[book.category].count++;
        }
      });
      
      setGenres(Object.values(genresMap));
      
      // Генерируем список авторов
      const authorsMap = {};
      books.forEach(book => {
        if (!authorsMap[book.author]) {
          authorsMap[book.author] = {
            id: Object.keys(authorsMap).length + 1,
            name: book.author,
            count: 1
          };
        } else {
          authorsMap[book.author].count++;
        }
      });
      setAuthors(Object.values(authorsMap));
      
      // Генерируем список годов
      const yearsSet = new Set(books.map(book => book.year));
      const yearsArray = Array.from(yearsSet).sort((a, b) => b - a); // Сортировка по убыванию
      setYears(yearsArray);
    }
  }, [books]);
  
  // Получение имени жанра по ID
  const genreName = (id) => {
    const genre = genres.find(g => g.id === id);
    return genre ? genre.name : null;
  };
  
  // Получение имени автора по ID
  const authorName = (id) => {
    const author = authors.find(a => a.id === id);
    return author ? author.name : null;
  };
  
  // Обработка поиска
  const handleSearch = (e) => {
    e.preventDefault();
    // Поиск уже реализован через useEffect и изменение searchQuery
  };
  
  // Обработчик сброса всех фильтров
  const resetFilters = () => {
    setSelectedGenre(null);
    setSelectedAuthor(null);
    setSelectedYear(null);
    setSearchQuery('');
    setSortBy('title');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">      
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Наш каталог книг</h2>
          <form onSubmit={handleSearch} className="ml-auto flex">
            <input
              type="text"
              placeholder="Поиск книг..."
              className="border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700"
            >
              Поиск
            </button>
          </form>
          
          {/* Кнопка сортировки */}
          <div className="relative ml-2">
            <button 
              className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none hover:bg-gray-50"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
              Сортировка
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    onClick={() => {setSortBy('title'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'title' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По названию (А-Я)
                  </button>
                  <button 
                    onClick={() => {setSortBy('author'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'author' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По автору (А-Я)
                  </button>
                  <button 
                    onClick={() => {setSortBy('year'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'year' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По году (старые сначала)
                  </button>
                  <button 
                    onClick={() => {setSortBy('year-desc'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'year-desc' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По году (новые сначала)
                  </button>
                  <button 
                    onClick={() => {setSortBy('price'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'price' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По цене (возрастание)
                  </button>
                  <button 
                    onClick={() => {setSortBy('price-desc'); setShowSortDropdown(false);}}
                    className={`${sortBy === 'price-desc' ? 'bg-primary-50 text-primary-700' : ''} w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                  >
                    По цене (убывание)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            {/* Фильтры */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Фильтры</h2>
                {(selectedGenre || selectedAuthor || selectedYear) && (
                  <button 
                    onClick={resetFilters}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>
            
            {/* Жанры */}
            <GenresList 
              genres={genres} 
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
            />
            
            {/* Авторы */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Авторы</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() => setSelectedAuthor(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${
                    selectedAuthor === null 
                      ? 'bg-primary-100 text-primary-800 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Все авторы
                </button>
                
                {authors.map((author) => (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthor(author.name)}
                    className={`w-full text-left px-3 py-2 rounded-md transition ${
                      selectedAuthor === author.name 
                        ? 'bg-primary-100 text-primary-800 font-medium' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {author.name}
                    <span className="text-gray-400 ml-2">({author.count})</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Годы */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Год издания</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() => setSelectedYear(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${
                    selectedYear === null 
                      ? 'bg-primary-100 text-primary-800 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Все годы
                </button>
                
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`w-full text-left px-3 py-2 rounded-md transition ${
                      selectedYear === year 
                        ? 'bg-primary-100 text-primary-800 font-medium' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:w-3/4">
            {/* Информация о примененных фильтрах */}
            {(selectedGenre || selectedAuthor || selectedYear) && (
              <div className="bg-primary-50 p-3 rounded-md mb-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-primary-700">Активные фильтры:</span>
                
                {selectedGenre && (
                  <span className="inline-flex items-center bg-white border border-primary-300 rounded-full px-3 py-1 text-sm text-primary-600">
                    Жанр: {genreName(selectedGenre)}
                    <button 
                      onClick={() => setSelectedGenre(null)} 
                      className="ml-1 text-primary-500 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {selectedAuthor && (
                  <span className="inline-flex items-center bg-white border border-primary-300 rounded-full px-3 py-1 text-sm text-primary-600">
                    Автор: {selectedAuthor}
                    <button 
                      onClick={() => setSelectedAuthor(null)} 
                      className="ml-1 text-primary-500 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {selectedYear && (
                  <span className="inline-flex items-center bg-white border border-primary-300 rounded-full px-3 py-1 text-sm text-primary-600">
                    Год: {selectedYear}
                    <button 
                      onClick={() => setSelectedYear(null)} 
                      className="ml-1 text-primary-500 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Книги не найдены</p>
                <p className="text-gray-400">Попробуйте изменить критерии поиска</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 
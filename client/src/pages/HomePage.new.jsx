import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon,
  BookOpenIcon,
  AcademicCapIcon, 
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

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

const FeaturedBooks = ({ books }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = books.length;
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(timer);
  }, [currentSlide]);
  
  if (!books.length) return null;
  
  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg mb-12">
      <div 
        className="flex transition-transform duration-500 ease-out h-96"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {books.map((book) => (
          <div key={book._id} className="min-w-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10"></div>
            <img 
              src={book.coverImageUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
              <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
              <p className="text-xl mb-4">{book.author}</p>
              <p className="mb-6 line-clamp-2 text-gray-200 max-w-2xl">{book.description}</p>
              <Link 
                to={`/books/${book._id}`}
                className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Подробнее
                <ChevronRightIcon className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-white z-30"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-white z-30"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
        {books.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentSlide === i ? 'bg-white' : 'bg-white/50'
            }`}
          />
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
  
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        
        // Реальный API-запрос к серверу
        const response = await axios.get('/api/books', {
          params: { 
            category: selectedGenre ? genreName(selectedGenre) : undefined,
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
        
        setBooks(filteredBooks);
        
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
  }, [selectedGenre, searchQuery]);
  
  // Подсчет жанров на основе загруженных книг
  useEffect(() => {
    if (books.length) {
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
    }
  }, [books]);
  
  // Получение имени жанра по ID
  const genreName = (id) => {
    const genre = genres.find(g => g.id === id);
    return genre ? genre.name : null;
  };
  
  // Обработка поиска
  const handleSearch = (e) => {
    e.preventDefault();
    // Поиск уже реализован через useEffect и изменение searchQuery
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <section>
        <FeaturedBooks books={featuredBooks} />
      </section>
      
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
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <GenresList 
              genres={genres} 
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
            />
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Темы</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary-50 text-primary-600 text-sm px-3 py-1 rounded-full">Бестселлеры</span>
                <span className="bg-primary-50 text-primary-600 text-sm px-3 py-1 rounded-full">Новинки</span>
                <span className="bg-primary-50 text-primary-600 text-sm px-3 py-1 rounded-full">Скидки</span>
                <span className="bg-primary-50 text-primary-600 text-sm px-3 py-1 rounded-full">Аудиокниги</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-3/4">
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
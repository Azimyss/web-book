import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import api from './utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkRentalExpirations } from './utils/bookService';

// Ленивая загрузка страниц для оптимизации производительности
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Компонент загрузки для ленивой загрузки
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию пользователя при загрузке приложения
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Запрос к API для проверки токена и получения данных пользователя
          const response = await api.get('/api/auth/me');
          
          // Сохраняем данные пользователя вместе с токеном
          const userData = {
            ...response.data,
            token: token
          };
          
          setUser(userData);
          
          // Проверяем сроки аренды книг
          if (response.data) {
            try {
              // Запрос к API для проверки сроков аренды
              await api.get('/api/user/check-rental-expirations');
            } catch (err) {
              console.error('Ошибка при проверке сроков аренды:', err);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка авторизации:', error);
        // Удаляем недействительный токен
        localStorage.removeItem('token');
        setUser(null);
        toast.error('Сессия истекла. Пожалуйста, войдите снова');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Устанавливаем интервал для регулярной проверки сроков аренды (раз в день)
    const checkRentalsInterval = setInterval(() => {
      if (user) {
        checkRentalExpirations(user.id);
      }
    }, 24 * 60 * 60 * 1000); // 24 часа
    
    return () => {
      clearInterval(checkRentalsInterval);
    };
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Layout user={user} setUser={setUser}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage setUser={setUser} />} />
          <Route path="/books/:id" element={<BookDetailsPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="/admin/*" element={<AdminDashboardPage user={user} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      
      {/* Контейнер для уведомлений */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Layout>
  );
}

export default App; 
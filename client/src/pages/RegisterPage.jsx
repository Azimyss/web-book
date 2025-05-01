import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const RegisterPage = ({ setUser }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [registerError, setRegisterError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку поля при изменении
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '', confirmPassword: '' };
    
    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
      valid = false;
    }
    
    // Валидация пароля
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
      valid = false;
    }
    
    // Валидация подтверждения пароля
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Очищаем общую ошибку
    setRegisterError('');
    
    // Валидация формы
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Отправка запроса на сервер для регистрации
      const response = await api.post('/api/auth/register', formData);
      
      // Получаем токен и данные пользователя
      const { token, user: userData } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);
      
      // Устанавливаем пользователя в состояние приложения
      setUser({ ...userData, token });
      
      // Перенаправляем пользователя на главную страницу
      navigate('/');
      
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        // Если ошибка связана с уже существующим email
        if (err.response.data.message.includes('email') && err.response.data.message.includes('уже существует')) {
          setFormErrors(prev => ({
            ...prev,
            email: 'Пользователь с таким email уже существует'
          }));
        } else {
          setRegisterError(err.response.data.message);
        }
      } else {
        setRegisterError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <UserPlusIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Регистрация
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Войдите
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
          {registerError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-4 text-sm">
              {registerError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Подтверждение пароля
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <p className="text-xs text-gray-500 text-center">
              Регистрируясь, вы соглашаетесь с нашими{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Условиями использования
              </Link>{' '}
              и{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Политикой конфиденциальности
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 
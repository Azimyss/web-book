import axios from 'axios';

// Создаем настроенный экземпляр axios с базовым URL
const api = axios.create({
  baseURL: '', // Используем относительные пути, т.к. настроен прокси в Vite
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для установки токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Добавляем перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок авторизации (только 401, не 403)
    // 401 - не авторизован (нет токена или токен недействителен)
    // 403 - запрещено (токен валидный, но нет прав доступа)
    if (error.response && error.response.status === 401) {
      // Удаляем токен только при ошибке авторизации 401
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api; 
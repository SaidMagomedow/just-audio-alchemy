import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthToken, getDevAuthToken, isAuthenticated } from './auth';

// Базовый URL для API
// const API_URL = 'http://localhost:8000';

// Создаем экземпляр Axios
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Перехватчик запросов для добавления токена авторизации
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Если пользователь авторизован, добавляем токен к запросу
    if (isAuthenticated()) {
      const token = getAuthToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      // Для разработки можно использовать тестовый токен
      const devToken = getDevAuthToken();
      if (devToken && config.headers) {
        config.headers['Authorization'] = `Bearer ${devToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для базовой обработки ошибок
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Логируем ошибку
    console.error('API Error:', error.message, error.response?.status);
    
    // При ошибке авторизации перенаправляем на страницу входа
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication error, redirecting to login');
      // Перенаправляем на страницу авторизации, если требуется
      // window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

export default api;
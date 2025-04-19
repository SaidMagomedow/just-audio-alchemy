import { createContext, useContext } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';

// Константы для хранения токенов
const AUTH_TOKEN_KEY = 'auth_token';
const DEV_AUTH_TOKEN = 'dev_token_123'; // Токен для разработки

// Базовый интерфейс для пользователя
export interface User {
  id: string; // Изменено с number на string для совместимости с Firebase UID
  name?: string;
  email?: string;
  token?: string; // Добавляем поле для токена
  photoURL?: string; // Добавлено для поддержки фото профиля из Firebase
}

// Интерфейс для контекста авторизации
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// Создаем контекст авторизации
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

// Хук для использования контекста авторизации
export const useAuth = () => useContext(AuthContext);

// Функция для получения ID пользователя
export const getUserId = (): string | null => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Функция для получения авторизационного токена
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Функция для получения заголовков авторизации
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
};

// Функция для проверки, залогинен ли пользователь
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Временная функция для разработки, возвращает ID тестового пользователя
export const getDevUserId = (): string => {
  return "1"; // ID для разработки
};

// Временная функция для разработки, возвращает тестовый токен
export const getDevAuthToken = (): string => {
  return DEV_AUTH_TOKEN;
};

/**
 * Сохраняет токен аутентификации в локальном хранилище
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Удаляет токен аутентификации из локального хранилища
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Сохраняет информацию о пользователе в локальном хранилище
 */
export const saveUserToLocalStorage = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Получает информацию о пользователе из локального хранилища
 */
export const getUserFromLocalStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }
  return null;
};

/**
 * Удаляет информацию о пользователе из локального хранилища
 */
export const removeUserFromLocalStorage = (): void => {
  localStorage.removeItem('user');
};

/**
 * Обновляет токен аутентификации (для использования с refresh token)
 * В реальном приложении здесь был бы запрос к API для обновления токена
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    // Здесь должен быть запрос к API для обновления токена
    // Заглушка для примера
    return null;
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return null;
  }
};

/**
 * Проверяет валидность текущего токена
 */
export const isTokenValid = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  // Здесь может быть логика проверки JWT токена
  // Например, проверка времени истечения токена
  try {
    // Для простоты просто проверяем наличие токена
    return true;
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return false;
  }
}; 
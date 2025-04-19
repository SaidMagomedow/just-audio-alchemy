import React, { useState, useEffect } from 'react';
import { AuthContext, User, getUserFromLocalStorage, setAuthToken, saveUserToLocalStorage, removeUserFromLocalStorage } from './auth';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import api from './api';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем только наличие пользователя в localStorage при загрузке
    const storedUser = getUserFromLocalStorage();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login function - you can implement real login later
    try {
      setLoading(true);
      // Mock successful login
      const mockUser: User = {
        id: '1',
        name: 'Mock User',
        email: email,
        photoURL: 'https://source.unsplash.com/random/100x100/?face',
        token: 'mock_token_123456789'
      };
      
      setUser(mockUser);
      saveUserToLocalStorage(mockUser);
      setAuthToken(mockUser.token || '');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      // 1. Вызываем авторизацию через Google
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Получаем токен из Firebase
      const idToken = await result.user.getIdToken();
      
      // 3. Отправляем токен на наш бэкенд для аутентификации
      try {
        const response = await api.post('/auth/firebase', {
          token: idToken
        });
        
        if (response.data && response.data.access_token) {
          // 4. Создаем данные пользователя с JWT токеном от нашего бэкенда
          const userData: User = {
            id: result.user.uid,
            name: result.user.displayName || 'User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || '',
            token: response.data.access_token
          };
          
          // 5. Обновляем состояние и сохраняем в localStorage
          setUser(userData);
          saveUserToLocalStorage(userData);
          setAuthToken(userData.token || '');
          
          toast.success('Авторизация успешна!');
        } else {
          throw new Error('Не удалось получить токен авторизации');
        }
      } catch (backendError) {
        console.error('Error getting JWT token from backend:', backendError);
        toast.error('Ошибка авторизации на сервере');
        throw backendError;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      removeUserFromLocalStorage();
      toast.success('Выход выполнен успешно');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Ошибка при выходе из системы');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: loading,
      isAuthenticated: !!user, 
      login, 
      logout, 
      loginWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 
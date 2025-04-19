import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCu_zbhU6uiTsms9hrSSB3e27P_WRUT2e8",
  authDomain: "just-audio-ai.firebaseapp.com",
  projectId: "just-audio-ai",
  storageBucket: "just-audio-ai.firebasestorage.app",
  messagingSenderId: "976010608348",
  appId: "1:976010608348:web:856e3d7da738309720be19",
  measurementId: "G-PZ8WKZV5G3"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Получаем экземпляр аутентификации
export const auth = getAuth(app);

// Создаем провайдер для Google аутентификации
export const googleProvider = new GoogleAuthProvider();

// Устанавливаем дополнительный параметр - запрос на выбор аккаунта
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app; 
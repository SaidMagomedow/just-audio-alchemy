
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">just.audio.ai</h3>
            <p className="text-gray-600 mb-4">
              AI-платформа для подкастеров и контент-мейкеров.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-500 hover:text-black">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-black">
                <span className="sr-only">YouTube</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Продукт</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Расшифровка</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Редактирование</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Очистка звука</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Видеогенерация</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Публикация</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Компания</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">О нас</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Блог</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Карьера</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Партнерство</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Контакты</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Документация</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Конфиденциальность</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition-colors">Условия использования</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-center">© 2025 just.audio.ai. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

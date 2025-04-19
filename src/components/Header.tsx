import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Folder, User, LogOut } from "lucide-react";
import { useAuth } from '@/lib/auth';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="w-full py-4 bg-white/90 backdrop-blur-md fixed top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-semibold">just.audio.ai</Link>
        </div>
        
        {isHomePage && (
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-black transition-colors">Возможности</a>
            <a href="#howitworks" className="text-gray-700 hover:text-black transition-colors">Как это работает</a>
            <a href="#pricing" className="text-gray-700 hover:text-black transition-colors">Тарифы</a>
            <a href="#faq" className="text-gray-700 hover:text-black transition-colors">FAQ</a>
          </nav>
        )}
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/my-files">
                <Button 
                  variant="outline" 
                  className="hidden md:inline-flex items-center gap-2"
                >
                  <Folder size={16} />
                  Мои файлы
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button 
                  variant="outline" 
                  className="hidden md:inline-flex items-center gap-2"
                >
                  <User size={16} />
                  {user?.name || 'Профиль'}
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="hidden md:inline-flex items-center gap-2 text-red-500 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" className="hidden md:inline-flex">Войти</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-black text-white hover:bg-gray-800">Регистрация</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

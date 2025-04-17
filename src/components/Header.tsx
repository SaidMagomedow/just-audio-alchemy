
import React from 'react';
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full py-4 bg-white/90 backdrop-blur-md fixed top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">just.audio.ai</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-black transition-colors">Возможности</a>
          <a href="#howitworks" className="text-gray-700 hover:text-black transition-colors">Как это работает</a>
          <a href="#pricing" className="text-gray-700 hover:text-black transition-colors">Тарифы</a>
          <a href="#faq" className="text-gray-700 hover:text-black transition-colors">FAQ</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="hidden md:inline-flex">Войти</Button>
          <Button className="bg-black text-white hover:bg-gray-800">Регистрация</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

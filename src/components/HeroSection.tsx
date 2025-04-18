
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="min-h-[90vh] flex items-center pt-20">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-heading">
            <span className="block">Быстрый перевод из</span>
            <span className="block text-accent-orange font-bold">аудио</span>
            <span className="block">в текст всего</span>
            <span className="block text-black">за пару минут</span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            AI-платформа для подкастеров и контент-мейкеров, которая автоматически улучшает и трансформирует ваш аудио-контент.
          </p>
          
          <div className="mt-16 flex flex-col items-center">
            <div className="w-full max-w-xl bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <p className="mb-6 text-center text-gray-600">Перетащите файл сюда или нажмите на кнопку ниже для транскрибации</p>
              
              <div className="flex justify-center">
                <ArrowDown size={32} className="text-black mb-4" />
              </div>
              
              <Button className="w-full py-6 text-lg bg-black hover:bg-accent-orange text-white hover:text-white">
                Загрузить файл
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Поддерживаются форматы MP3, WAV, MP4, MOV и другие
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

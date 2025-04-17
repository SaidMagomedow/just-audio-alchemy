
import React from 'react';
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: 'Шаг 1',
    title: 'Загрузите аудио или видео',
    description: 'Загрузите файл или вставьте ссылку на YouTube, Spotify или другой сервис.'
  },
  {
    step: 'Шаг 2',
    title: 'AI анализирует контент',
    description: 'Наши алгоритмы распознают речь, очищают звук и анализируют содержание.'
  },
  {
    step: 'Шаг 3',
    title: 'Редактируйте результат',
    description: 'Используйте встроенный редактор с AI-ассистентом для улучшения транскрипции.'
  },
  {
    step: 'Шаг 4',
    title: 'Публикуйте и делитесь',
    description: 'Экспортируйте в нужном формате или делитесь напрямую на популярных платформах.'
  }
];

const HowItWorksSection = () => {
  return (
    <section id="howitworks" className="py-20">
      <div className="container">
        <h2 className="section-heading text-center">Как работает наш сервис</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {steps.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm font-medium text-accent-orange mb-2">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Button className="px-8 py-6 text-lg bg-black hover:bg-gray-800 text-white">
            Попробовать бесплатно
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

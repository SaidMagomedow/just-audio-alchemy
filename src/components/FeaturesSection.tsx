
import React from 'react';
import { Mic, VolumeX, Music, MessageSquare, FileText, Video, Share2 } from 'lucide-react';

const features = [
  {
    icon: <Mic size={32} />,
    title: 'Автоматическая расшифровка',
    description: 'Быстро конвертируйте аудио и видео в текст с высокой точностью распознавания речи и разметкой.'
  },
  {
    icon: <VolumeX size={32} />,
    title: 'Очистка звука',
    description: 'Удаляйте фоновые шумы, улучшайте качество голоса и корректируйте уровни звука.'
  },
  {
    icon: <Music size={32} />,
    title: 'Удаление вокала',
    description: 'Легко отделяйте голос от музыки или извлекайте инструментальные дорожки из аудиофайлов.'
  },
  {
    icon: <MessageSquare size={32} />,
    title: 'ChatGPT-помощник',
    description: 'Используйте ИИ для редактирования и улучшения транскрипции, создания резюме контента.'
  },
  {
    icon: <FileText size={32} />,
    title: 'Генерация описаний',
    description: 'Автоматически создавайте привлекательные описания и заголовки для ваших эпизодов.'
  },
  {
    icon: <Video size={32} />,
    title: 'Создание коротких видео',
    description: 'Выделяйте лучшие моменты и создавайте короткие клипы с субтитрами для социальных сетей.'
  },
  {
    icon: <Share2 size={32} />,
    title: 'Smart-публикация',
    description: 'Распространяйте контент на популярных платформах: Spotify, YouTube, Apple Podcasts и других.'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="section-heading text-center mb-12">Наши возможности</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="mb-4 text-accent-orange">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

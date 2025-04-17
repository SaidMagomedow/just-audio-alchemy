
import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    content: "Just.Audio.AI изменил мой рабочий процесс. Раньше я тратил часы на расшифровку подкастов, а теперь все происходит автоматически с поразительной точностью.",
    author: "Иван Петров",
    position: "Подкастер, «Технологии будущего»"
  },
  {
    content: "Функция удаления вокала просто потрясающая! Я использую ее для создания караоке-версий песен и инструментальных треков для своих видео.",
    author: "Мария Сидорова",
    position: "YouTube-блогер"
  },
  {
    content: "ChatGPT-помощник помогает мне редактировать транскрипции и создавать идеальные описания для эпизодов. Экономит кучу времени и делает контент более привлекательным.",
    author: "Алексей Иванов",
    position: "Подкастер, «Бизнес сегодня»"
  },
  {
    content: "Публикация на разных платформах одним кликом — это именно то, что мне было нужно. Теперь я могу сосредоточиться на создании контента, а не на его распространении.",
    author: "Екатерина Новикова",
    position: "Контент-маркетолог"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="section-heading text-center">Что говорят пользователи</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
              
              <div>
                <p className="font-medium">{testimonial.author}</p>
                <p className="text-sm text-gray-500">{testimonial.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

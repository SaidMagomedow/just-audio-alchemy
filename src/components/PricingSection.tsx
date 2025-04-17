
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

const plans = [
  {
    name: '100 минут',
    originalPrice: '500 ₽',
    currentPrice: '300 ₽',
    discount: 'Скидка 50%',
    per: '1 час = ?',
    features: [
      'Расшифровка аудио и видео',
      'Базовая очистка звука',
      'Экспорт в TXT, DOCX',
      'Поддержка по email'
    ],
    cta: 'Купить за 300 рублей'
  },
  {
    name: '500 минут',
    originalPrice: '2 000 ₽',
    currentPrice: '1 200 ₽',
    discount: 'Скидка 60%',
    per: '1 час = ?',
    popular: true,
    features: [
      'Все функции базового плана',
      'Расширенная очистка звука',
      'Удаление вокала из аудио',
      'ChatGPT-помощник',
      'Приоритетная поддержка'
    ],
    cta: 'Купить за 1 200 рублей'
  },
  {
    name: '1 000 минут',
    originalPrice: '4 000 ₽',
    currentPrice: '2 000 ₽',
    discount: 'Скидка 70%',
    per: '1 час = ?',
    features: [
      'Все функции продвинутого плана',
      'Генерация коротких видео',
      'Публикация на платформах',
      'API доступ',
      'Выделенный менеджер'
    ],
    cta: 'Купить за 2 000 рублей'
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="section-heading text-center">Тарифные планы</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Выберите подходящий тариф для ваших задач. Мы предлагаем гибкую систему оплаты и специальные скидки для новых пользователей.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card relative ${plan.popular ? 'ring-2 ring-accent-orange' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                  Популярный
                </div>
              )}
              
              <div className="mb-6">
                <div className="text-lg font-semibold">{plan.name}</div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold">{plan.currentPrice}</span>
                  <span className="ml-2 text-sm line-through text-gray-400">{plan.originalPrice}</span>
                </div>
                <div className="mt-1 text-sm text-accent-orange font-medium">{plan.discount}</div>
                <div className="mt-1 text-xs text-gray-500">{plan.per}</div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-green-500 flex-shrink-0 mt-0.5">
                      <Check size={16} />
                    </span>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-black hover:bg-gray-800 text-white">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

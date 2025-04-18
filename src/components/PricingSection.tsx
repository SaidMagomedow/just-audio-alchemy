
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Бесплатно',
    price: '0 ₽',
    per: 'навсегда',
    features: [
      'До 60 минут записи в месяц',
      'Базовая расшифровка аудио',
      'Стандартное качество звука',
      'Экспорт в TXT формат',
      'Поддержка по email'
    ],
    cta: 'Попробовать бесплатно',
    popular: false
  },
  {
    name: 'Премиум',
    price: '990 ₽',
    per: 'в месяц',
    popular: true,
    features: [
      'До 10 часов записи в месяц',
      'Продвинутая расшифровка аудио',
      'Улучшенное качество звука',
      'Удаление шума и фоновых звуков',
      'Экспорт в PDF, DOCX, TXT',
      'ChatGPT-помощник',
      'Приоритетная поддержка'
    ],
    cta: 'Выбрать Premium'
  },
  {
    name: 'Премиум+',
    price: '2 490 ₽',
    per: 'в месяц',
    features: [
      'Безлимитное количество записей',
      'Расширенная расшифровка аудио',
      'AI-обработка звука',
      'Удаление шума, вокала и мелодий',
      'Все форматы экспорта',
      'Продвинутый ChatGPT-ассистент',
      'Выделенный менеджер',
      'API доступ'
    ],
    cta: 'Выбрать Premium+'
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-4">Тарифные планы</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Выберите подходящий тариф для ваших задач. Оплачивайте только то, что вам действительно нужно.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-accent-orange transform hover:-translate-y-1' : 'hover:shadow-xl'
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                  Популярный выбор
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="ml-2 text-gray-500">/{plan.per}</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-green-500 flex-shrink-0 mt-1">
                      <Check size={16} />
                    </span>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-accent-orange hover:bg-orange-600 text-white' 
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          Все тарифы включают 14-дневный пробный период. Отмена подписки в любой момент.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;

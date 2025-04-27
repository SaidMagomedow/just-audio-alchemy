import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserProductPlan } from '@/types/userPlan';

// Добавление типов для CloudPayments
declare global {
  interface Window {
    cp: {
      CloudPayments: new () => {
        charge: (
          options: {
            publicId: string;
            description: string;
            amount: number;
            currency: string;
            accountId: string;
            data: any;
            skin: 'modern' | 'classic';
          },
          successCallback: () => void,
          failCallback: () => void
        ) => void;
      }
    }
  }
}

// Типы данных для продуктов с API
interface Product {
  uuid: string;
  display_name: string;
  slug: string;
  price: number;
  price_with_discount: number | null;
  discount_deadline: string | null;
  minute_count: number;
  discount: number;
  is_subs: boolean;
  billing_cycle: string | null;
  features: string[];
  cta_text: string | null;
  is_can_select_gpt_model: boolean;
  gpt_request_limit_one_file: number | null;
  vtt_file_ext_support: boolean;
  srt_file_ext_support: boolean;
}

// Типы данных для отображения тарифов
interface PricingPlan {
  name: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
  popular: boolean;
  productId: string;
  priceValue: number;
  is_subs: boolean;
  minute_count: number;
  billing_cycle?: 'month' | 'year';
}

// Получаем ID пользователя из localStorage
function getUserId(): number | null {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

interface PricingSectionProps {
  userPlan?: UserProductPlan | null;
}

const PricingSection: React.FC<PricingSectionProps> = ({ userPlan }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(getUserId());
  const [checkoutReady, setCheckoutReady] = useState<boolean>(false);

  // Проверяем наличие CloudPayments Checkout в window при монтировании компонента
  useEffect(() => {
    console.log('PricingSection component mounted');
    
    // Проверяем наличие CloudPayments API
    if (window.cp && window.cp.CloudPayments) {
      console.log('CloudPayments API успешно инициализирован');
      setCheckoutReady(true);
    } else {
      console.warn('CloudPayments API не найден. Проверяем скрипт...');
      
      // Проверяем наличие скрипта
      const scriptExists = document.querySelector('script[src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"]');
      console.log('Скрипт CloudPayments в DOM:', !!scriptExists);
      
      if (!scriptExists) {
        console.log('Загружаем скрипт CloudPayments принудительно');
        const script = document.createElement('script');
        script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
        document.head.appendChild(script);
      }
    }
  }, []);

  // Получаем данные пользователя
  useEffect(() => {
    if (userId) return;
    axios.get('/api/user/me')
      .then(response => {
        if (response.data?.id) {
          setUserId(response.data.id);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      })
      .catch(() => {
        // пользователь не авторизован
      });
  }, [userId]);

  // Загрузка тарифов
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = '/api/products/active';
        setDebugInfo(`Запрос: ${url}`);
        const response = await axios.get<Product[]>(url);
        const transformed = response.data.map(product => ({
          name: product.display_name,
          price: product.price === 0 ? '0 ₽' : `${product.price.toLocaleString('ru-RU')} ₽`,
          per: product.is_subs ? (product.billing_cycle === 'month' ? 'в месяц' : 'в год') : 'навсегда',
          features: product.features || [],
          cta: product.cta_text || `Выбрать ${product.display_name}`,
          popular: product.slug === 'premium',
          productId: product.uuid,
          priceValue: product.price,
          is_subs: product.is_subs,
          minute_count: product.minute_count,
          billing_cycle: product.billing_cycle as 'month' | 'year',
        }));
        setPlans(transformed);
        setLoading(false);
        setDebugInfo(null);
      } catch (err: any) {
        console.error(err);
        setError('Не удалось загрузить тарифы');
        setLoading(false);
        setPlans([ /*...стандартные планы*/ ]);
      }
    };
    fetchProducts();
  }, []);

  // Обработчик оплаты через CloudPayments
  const handlePayment = useCallback((plan: PricingPlan) => {
    if (!getUserId()) {
      window.location.href = '/auth?redirect=pricing';
      return;
    }

    if (plan.priceValue <= 0) {
      window.location.href = '/?success=free_plan';
      return;
    }

    // Проверяем готовность CloudPayments API
    if (!checkoutReady) {
      toast({ 
        title: 'Платежная система загружается',
        description: 'Пожалуйста, подождите несколько секунд и попробуйте снова.',
        duration: 3000
      });
      return;
    }

    try {
      // Проверяем доступность API CloudPayments
      if (!window.cp || !window.cp.CloudPayments) {
        toast({ 
          title: 'Ошибка платежной системы',
          description: 'Не удалось загрузить платежный виджет. Пожалуйста, обновите страницу.',
          variant: 'destructive'
        });
        return;
      }
      
      // Создаём виджет
      const widget = new window.cp.CloudPayments();

      // Рассчитываем дату начала подписки (текущая дата + 7 дней)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Добавляем 7 дней к текущей дате
      
      // Форматируем дату в формат yyyy-MM-dd
      const formattedStartDate = startDate.toISOString().split('T')[0];

      // Подготавливаем data
      const data: any = {
        productId: plan.productId,
        minuteCount: plan.minute_count,
        // Если это подписка, добавляем рекуррентные параметры
        CloudPayments: {
          recurrent: plan.is_subs ? {
            interval: plan.billing_cycle === 'month' ? 'Month' : 'Year', // «Month» или «Year»
            period: 1,          // раз в 1 месяц/год
            startDate: formattedStartDate, // Дата первого списания (через неделю)
            amount: plan.priceValue // Сумма для регулярных списаний (полная стоимость)
          } : undefined
        }
      };

      widget.charge(
        {
          publicId: 'pk_addba62205c5788cb5cfcfa1c94bc',
          description: `Оплата тарифа ${plan.name} (пробный период)`,
          amount: 1, // Стоимость за первую неделю (пробный период) - 1 рубль
          currency: 'RUB',
          accountId: getUserId()!.toString(),
          data,
          skin: 'modern',
        },
        () => {
          // success
          window.location.href = '/?success=payment';
        },
        () => {
          // fail
          window.location.href = '/?error=payment';
        }
      );
    } catch (error) {
      console.error('Ошибка при инициализации платежа:', error);
      toast({
        title: 'Ошибка при оплате',
        description: 'Произошла техническая ошибка. Пожалуйста, попробуйте позже.',
        variant: 'destructive'
      });
    }
  }, [checkoutReady]);

  // Если есть данные о подписке пользователя, показываем информацию о ней
  if (userPlan) {
    // Проверяем, что мы на странице профиля (не на главной)
    const isProfilePage = window.location.pathname.includes('/profile');
    
    // На странице профиля показываем информацию о подписке
    if (isProfilePage) {
      return (
        <section className="py-10 bg-gray-50">
          <div className="container max-w-4xl mx-auto space-y-6">
            {/* Subscription Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Текущая подписка</CardTitle>
                <Badge variant="default" className="bg-accent-orange">
                  {userPlan.is_subscription ? 'Подписка' : 'Разовый план'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Активна до {new Date(userPlan.expires_at).toLocaleDateString('ru-RU')}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Стоимость:</span>
                    <span className="text-sm text-gray-700 font-medium">{userPlan.amount} ₽</span>
                  </div>
                  <Button className="w-full bg-accent-orange hover:bg-orange-600">
                    Управление подпиской
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Использование сервиса</CardTitle>
                <CardDescription>Статистика использования в текущем месяце</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Minutes */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Минуты аудио</span>
                    <span className="text-sm text-gray-500">
                      {userPlan.minute_count_used} / {userPlan.minute_count_limit} мин
                    </span>
                  </div>
                  <Progress 
                    value={(userPlan.minute_count_used / userPlan.minute_count_limit) * 100} 
                    className="h-2"
                  />
                </div>

                {/* AI Processing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">AI-обработка</span>
                    <span className="text-sm text-gray-500">
                      {userPlan.gpt_request_limit_one_file ? 
                        `До ${userPlan.gpt_request_limit_one_file} запросов на файл` : 
                        'Недоступно'}
                    </span>
                  </div>
                  {userPlan.gpt_request_limit_one_file > 0 && (
                    <div className="flex gap-2 text-xs text-gray-500">
                      <div className={`rounded px-2 py-1 ${userPlan.is_can_select_gpt_model ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        Выбор модели GPT: {userPlan.is_can_select_gpt_model ? 'Да' : 'Нет'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Special features */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Дополнительные возможности</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`rounded px-2 py-1 ${userPlan.is_can_remove_melody ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      Удаление мелодии: {userPlan.is_can_remove_melody ? 'Да' : 'Нет'}
                    </div>
                    <div className={`rounded px-2 py-1 ${userPlan.is_can_remove_vocal ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      Удаление вокала: {userPlan.is_can_remove_vocal ? 'Да' : 'Нет'}
                    </div>
                    <div className={`rounded px-2 py-1 ${userPlan.is_can_remove_noise ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      Удаление шума: {userPlan.is_can_remove_noise ? 'Да' : 'Нет'}
                    </div>
                    <div className={`rounded px-2 py-1 ${userPlan.vtt_file_ext_support ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      Поддержка VTT: {userPlan.vtt_file_ext_support ? 'Да' : 'Нет'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      );
    }
    
    // Если мы на главной странице и у пользователя есть подписка,
    // не показываем раздел с тарифами вообще
    return null;
  }

  if (loading) {
    return <section className="py-20 bg-gray-50 text-center">Загрузка...</section>;
  }
  if (error) {
    return <section className="py-20 bg-gray-50 text-center">{error}</section>;
  }

  // Если нет данных о подписке, показываем обычный интерфейс выбора тарифов
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
              className={`relative bg-white rounded-lg shadow-lg p-8 flex flex-col ${
                plan.popular ? 'ring-2 ring-[#F97316] transform hover:-translate-y-1' : 'hover:shadow-xl'
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#F97316] text-white px-3 py-1 rounded-full text-sm font-medium">
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
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-green-500 flex-shrink-0 mt-1">
                      <Check size={16} />
                    </span>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className="w-full mt-auto py-2 px-4 rounded-md text-white bg-black hover:bg-[#F97316] transition-colors duration-200"
                onClick={() => handlePayment(plan)}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          Все тарифы включают 7-дневный пробный период. Отмена подписки в любой момент.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Info } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { UserProductPlan } from '@/types/userPlan';
import { getUserPlan } from '@/lib/api/userPlan';
import { isAuthenticated } from '@/lib/auth';

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
  originalPrice?: string;
  per: string;
  features: string[];
  cta: string;
  popular: boolean;
  productId: string;
  priceValue: number;
  is_subs: boolean;
  minute_count: number;
  billing_cycle?: 'month' | 'year';
  hasDiscount: boolean;
  isCurrentPlan: boolean;
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

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

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

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose, feature }) => {
  const [showPricing, setShowPricing] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserProductPlan | null>(null);
  const [checkoutReady, setCheckoutReady] = useState<boolean>(false);
  const [showAllFeatures, setShowAllFeatures] = useState<{[key: string]: boolean}>({});
  const [debug, setDebug] = useState<string>('');

  // Проверяем наличие CloudPayments Checkout
  useEffect(() => {
    // Проверяем наличие CloudPayments API
    if (window.cp && window.cp.CloudPayments) {
      setCheckoutReady(true);
    } else {
      // Проверяем наличие скрипта
      const scriptExists = document.querySelector('script[src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"]');
      
      if (!scriptExists) {
        const script = document.createElement('script');
        script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
        script.onload = () => setCheckoutReady(true);
        document.head.appendChild(script);
      }
    }
  }, []);

  // Получаем текущий план пользователя
  useEffect(() => {
    if (!isOpen || !showPricing) return;
    if (!isAuthenticated()) {
      setDebug('Пользователь не авторизован');
      return;
    }

    const fetchUserPlan = async () => {
      try {
        setLoading(true);
        // Используем getUserPlan из userPlan.ts
        const planData = await getUserPlan();
        
        console.log('Текущий план пользователя:', planData);
        
        if (planData && planData.product_id) {
          setUserPlan(planData);
        } else {
          setUserPlan(null);
        }
      } catch (err: any) {
        console.log('Ошибка при получении данных о подписке:', err);
        setDebug(`Error fetching user plan: ${err.message || 'Unknown error'}`);
        // Если ошибка 401/403, то пользователь не авторизован
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setDebug('User not authenticated: ' + err.response.status);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [isOpen, showPricing]);

  // Загрузка тарифов
  useEffect(() => {
    if (!isOpen || !showPricing) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Product[]>('/api/products/active');
        
        // Предварительная проверка данных
        if (!Array.isArray(response.data) || response.data.length === 0) {
          setDebug('API returned empty or invalid products array');
          setError('Не удалось загрузить тарифы: пустой ответ API');
          setLoading(false);
          return;
        }
        
        console.log('Доступные продукты:', response.data);
        
        // Логируем первый продукт для анализа структуры
        if (response.data.length > 0) {
          console.log('Пример структуры продукта:', JSON.stringify(response.data[0], null, 2));
        }
        
        const transformed = response.data.map(product => {
          const hasDiscount = product.price_with_discount !== null;
          const displayPrice = hasDiscount ? product.price_with_discount! : product.price;
          
          // Проверяем соответствие по ID - точное сравнение
          let isCurrentPlan = false;
          
          if (userPlan && userPlan.product_id) {
            // Приводим к строке для безопасного сравнения, так как типы могут отличаться
            const userProductId = String(userPlan.product_id);
            const currentProductId = String(product.uuid);
            
            isCurrentPlan = userProductId === currentProductId;
            
            console.log(`Comparing product IDs: User's="${userProductId}" vs Product's="${currentProductId}" = ${isCurrentPlan}`);
          }
          
          // Инициализация состояния для отображения/скрытия фич
          if (isCurrentPlan) {
            setShowAllFeatures(prev => ({...prev, [product.uuid]: true}));
            console.log(`Marked product ${product.display_name} as current plan!`);
          }
          
          return {
            name: product.display_name,
            price: displayPrice === 0 ? '0 ₽' : `${displayPrice.toLocaleString('ru-RU')} ₽`,
            originalPrice: hasDiscount ? `${product.price.toLocaleString('ru-RU')} ₽` : undefined,
            per: product.is_subs ? (product.billing_cycle === 'month' ? 'в месяц' : 'в год') : 'навсегда',
            features: product.features || [],
            cta: product.cta_text || `Выбрать ${product.display_name}`,
            popular: product.slug === 'premium',
            productId: product.uuid,
            priceValue: hasDiscount ? product.price_with_discount! : product.price,
            is_subs: product.is_subs,
            minute_count: product.minute_count,
            billing_cycle: product.billing_cycle as 'month' | 'year',
            hasDiscount,
            isCurrentPlan
          }
        });
        
        console.log('Трансформированные планы:', transformed);
        
        // Проверяем наличие текущего плана
        const currentPlanExists = transformed.some(plan => plan.isCurrentPlan);
        setDebug(prev => `${prev}, CurrentPlan: ${currentPlanExists}, Auth: ${isAuthenticated()}`);
        
        setPlans(transformed);
        setLoading(false);
      } catch (err: any) {
        console.error('Ошибка при загрузке тарифов:', err);
        setError('Не удалось загрузить тарифы');
        setLoading(false);
        setPlans([]);
      }
    };
    fetchProducts();
  }, [isOpen, showPricing, userPlan]);

  // Обработчик оплаты через CloudPayments
  const handlePayment = useCallback((plan: PricingPlan) => {
    if (plan.isCurrentPlan) {
      toast({
        title: 'Это ваш текущий тариф',
        description: 'Вы уже используете этот тарифный план',
        duration: 3000
      });
      return;
    }

    if (!isAuthenticated()) {
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
          publicId: 'pk_b679330daec18f771a64bb934bab9',
          description: `Оплата тарифа ${plan.name} (пробный период) Далее будет списываться полная сумма`,
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

  const handleViewPlans = () => {
    setShowPricing(true);
  };

  const handleBack = () => {
    setShowPricing(false);
  };
  
  const toggleFeatures = (productId: string) => {
    setShowAllFeatures(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  if (!showPricing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Расширьте возможности</DialogTitle>
            <DialogDescription>
              Функция <strong>{feature}</strong> доступна только в расширенной подписке.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Улучшите вашу подписку, чтобы получить доступ к дополнительным возможностям, включая:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
              <li>Скачивание расшифровок в различных форматах</li>
              <li>Удаление шумов и мелодий из аудио</li>
              <li>Расширенные возможности работы с GPT</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleViewPlans} className="bg-[#F97316] hover:bg-orange-600">
              Посмотреть тарифы
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите подходящий тариф</DialogTitle>
          <DialogDescription>
            Оплачивайте только то, что вам действительно нужно.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center">Загрузка...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-500">{error}</div>
        ) : (
          <div className="space-y-6">
            
            {!isAuthenticated() && (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
                <p className="text-sm text-yellow-800 mb-2 font-medium">
                  Войдите в аккаунт, чтобы увидеть текущую подписку и управлять тарифами
                </p>
                <Button 
                  onClick={() => window.location.href = '/auth?redirect=pricing'} 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                >
                  Войти в аккаунт
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-lg border p-5 flex flex-col ${
                    plan.isCurrentPlan ? 'border-2 border-green-500 shadow-md' :
                    plan.popular ? 'border-2 border-[#F97316] shadow-md' : 'border-gray-200'
                  }`}
                >
                  {plan.popular && !plan.isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#F97316] text-white px-3 py-1 rounded-full text-sm font-medium">
                      Популярный выбор
                    </Badge>
                  )}
                  
                  {plan.isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Текущая подписка
                    </Badge>
                  )}
                  
                  <div className="mb-5">
                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline flex-wrap">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.hasDiscount && plan.originalPrice && (
                        <span className="ml-2 text-gray-400 line-through text-base">{plan.originalPrice}</span>
                      )}
                      <span className="ml-2 text-gray-500 text-base">/{plan.per}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-5 flex-grow text-sm">
                    {(showAllFeatures[plan.productId] ? plan.features : plan.features.slice(0, 5)).map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-green-500 flex-shrink-0 mt-0.5">
                          <Check size={16} />
                        </span>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.features.length > 5 && (
                    <button 
                      onClick={() => toggleFeatures(plan.productId)}
                      className="text-blue-500 hover:text-blue-700 text-sm mb-4 underline"
                    >
                      {showAllFeatures[plan.productId] ? 'Скрыть детали' : `Показать все ${plan.features.length} возможностей`}
                    </button>
                  )}
                  
                  <button 
                    className={`w-full py-3 px-4 rounded-md text-white ${
                      plan.isCurrentPlan 
                        ? 'bg-green-500 cursor-not-allowed opacity-70' 
                        : 'bg-black hover:bg-[#F97316] transition-colors duration-200'
                    }`}
                    onClick={() => handlePayment(plan)}
                    disabled={plan.isCurrentPlan}
                  >
                    {plan.isCurrentPlan ? 'Текущая подписка' : plan.cta}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="text-center text-gray-500 text-sm">
              <p>Все тарифы включают 7-дневный пробный период. Отмена подписки в любой момент.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleBack}>Назад</Button>
              <Button variant="outline" onClick={onClose}>Закрыть</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal;
import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentNotification: React.FC = () => {
  useEffect(() => {
    // Получаем параметры URL
    const queryParams = new URLSearchParams(window.location.search);
    const success = queryParams.get('success');
    const error = queryParams.get('error');

    if (success === 'payment') {
      // Успешная оплата
      toast({
        title: 'Оплата успешно выполнена!',
        description: 'Ваша подписка успешно активирована. Вы можете приступить к использованию расширенных возможностей.',
        variant: 'default',
        className: 'bg-green-50 border-green-200',
        action: (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ),
        duration: 5000,
      });
      
      // Удаление параметра из URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (success === 'free_plan') {
      // Активация бесплатного плана
      toast({
        title: 'Бесплатный план активирован!',
        description: 'Вы успешно активировали бесплатный план. Добро пожаловать!',
        variant: 'default',
        className: 'bg-green-50 border-green-200',
        action: (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ),
        duration: 5000,
      });
      
      // Удаление параметра из URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (error === 'payment') {
      // Ошибка оплаты
      toast({
        title: 'Ошибка при оплате',
        description: 'Во время выполнения платежа произошла ошибка. Пожалуйста, попробуйте еще раз или обратитесь в службу поддержки.',
        variant: 'destructive',
        action: (
          <XCircle className="h-5 w-5 text-red-500" />
        ),
        duration: 7000,
      });
      
      // Удаление параметра из URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Компонент не рендерит никакой UI, только показывает уведомления
  return null;
};

export default PaymentNotification; 
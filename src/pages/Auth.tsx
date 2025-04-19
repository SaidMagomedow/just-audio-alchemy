import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Send, Chrome } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { setAuthToken, saveUserToLocalStorage } from '@/lib/auth';

const emailSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный email адрес",
  }),
  consent: z.boolean().refine(value => value === true, {
    message: "Необходимо согласиться с условиями использования",
  }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [isCodeSent, setIsCodeSent] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '']);
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      consent: false,
    },
  });

  const onSubmit = async (values: EmailFormValues) => {
    try {
      setIsLoading(true);
      setEmail(values.email);
      
      // Отправляем запрос на получение кода подтверждения
      await api.post('/auth/email/code', {
        email: values.email
      });
      
      toast({
        title: "Успешно",
        description: "Код подтверждения отправлен на вашу почту"
      });
      setIsCodeSent(true);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: "Ошибка отправки кода",
        description: "Не удалось отправить код подтверждения. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // После успешной авторизации перенаправляем на главную страницу
      navigate('/');
      toast({
        title: "Успешная авторизация",
        description: "Вы успешно вошли в систему через Google",
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти через Google. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Автоматический переход к следующему полю
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };
  
  const verifyCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 4) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите 4-значный код",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Отправляем запрос на проверку кода
      const response = await api.post('/auth/email/verify-code', {
        email: email,
        code: code
      });
      
      if (response.data && response.data.access_token) {
        // Создаем объект пользователя
        const userData = {
          id: response.data.user_id,
          email: email,
          token: response.data.access_token
        };
        
        // Сохраняем данные пользователя
        saveUserToLocalStorage(userData);
        setAuthToken(response.data.access_token);
        
        toast({
          title: "Успех",
          description: "Авторизация успешна!"
        });
        navigate('/');
      } else {
        throw new Error('Некорректный ответ от сервера');
      }
    } catch (error) {
      console.error('Code verification error:', error);
      toast({
        title: "Ошибка",
        description: "Неверный код подтверждения. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-semibold mb-6 text-center">Войти или зарегистрироваться</h1>
        
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="social">Через соцсети</TabsTrigger>
            <TabsTrigger value="email">По Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="social" className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Chrome size={18} />
              <span>{isLoading ? "Входим..." : "Войти через Google"}</span>
            </Button>
            
            <Button className="w-full justify-start gap-2 bg-[#26A5E4] hover:bg-[#0088cc]" onClick={() => console.log('Telegram auth')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.269c-.145.658-.537.818-1.084.51l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121L8.48 13.037l-2.95-.924c-.642-.203-.654-.642.135-.954l11.514-4.435c.536-.196 1.006.121.833.524z" />
              </svg>
              <span>Войти через Telegram</span>
            </Button>
          </TabsContent>
          
          <TabsContent value="email">
            {!isCodeSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email адрес</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@mail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Я согласен с <a href="#" className="text-primary underline">условиями использования</a>
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? "Отправка..." : "Получить код"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-sm text-gray-600">
                  Мы отправили код подтверждения на вашу почту
                </p>
                
                <div className="flex justify-center gap-2">
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      className="w-12 h-12 text-center text-lg"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                    />
                  ))}
                </div>
                
                <p className="text-center text-sm">
                  Не получили код? <button className="text-primary underline" onClick={() => form.handleSubmit(onSubmit)()}>Отправить повторно</button>
                </p>
                
                <Button
                  className="w-full"
                  disabled={verificationCode.some(digit => !digit) || isLoading}
                  onClick={verifyCode}
                >
                  {isLoading ? "Проверка..." : "Проверить код"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Нужна помощь? <a href="#" className="text-primary underline">Связаться с поддержкой</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Auth;

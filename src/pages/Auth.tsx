
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Google, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthLayout from '@/components/AuthLayout';

const smsSchema = z.object({
  phone: z.string().min(10, {
    message: "Номер телефона должен содержать не менее 10 цифр",
  }),
  consent: z.boolean().refine(value => value === true, {
    message: "Необходимо согласиться с условиями использования",
  }),
});

type SmsFormValues = z.infer<typeof smsSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [isCodeSent, setIsCodeSent] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '']);

  const form = useForm<SmsFormValues>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      phone: '',
      consent: false,
    },
  });

  const onSubmit = (values: SmsFormValues) => {
    console.log(values);
    setIsCodeSent(true);
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
    
    // Проверяем, заполнены ли все поля
    if (newCode.every(digit => digit) && newCode.join('').length === 4) {
      console.log('Code submitted:', newCode.join(''));
      // В реальном приложении здесь будет проверка кода
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-semibold mb-6 text-center">Войти или зарегистрироваться</h1>
        
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="social">Через соцсети</TabsTrigger>
            <TabsTrigger value="sms">По SMS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="social" className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => console.log('Google auth')}>
              <Google size={18} />
              <span>Войти через Google</span>
            </Button>
            
            <Button className="w-full justify-start gap-2 bg-[#26A5E4] hover:bg-[#0088cc]" onClick={() => console.log('Telegram auth')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.269c-.145.658-.537.818-1.084.51l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121L8.48 13.037l-2.95-.924c-.642-.203-.654-.642.135-.954l11.514-4.435c.536-.196 1.006.121.833.524z" />
              </svg>
              <span>Войти через Telegram</span>
            </Button>
          </TabsContent>
          
          <TabsContent value="sms">
            {!isCodeSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер телефона</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (___) ___-__-__" {...field} />
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
                  
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Получить код
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-sm text-gray-600">
                  Мы отправили код подтверждения на ваш номер телефона
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
                  Не получили код? <button className="text-primary underline" onClick={() => console.log('Resend code')}>Отправить повторно</button>
                </p>
                
                <Button
                  className="w-full"
                  disabled={verificationCode.some(digit => !digit)}
                  onClick={() => console.log('Verify code:', verificationCode.join(''))}
                >
                  Проверить код
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

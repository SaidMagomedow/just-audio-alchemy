import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, HelpCircle, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth';

const UserProfile = () => {
  const { user } = useAuth();
  
  // Mock data - replace with real data when implementing backend
  const userData = {
    name: user?.name || "Алексей Иванов",
    email: user?.email || "alexey@example.com",
    avatarUrl: user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    plan: "Премиум",
    subscriptionEnd: "2024-05-18",
    usage: {
      audioMinutes: {
        used: 342,
        total: 600,
      },
      aiProcessing: {
        used: 15,
        total: 30,
      },
      storage: {
        used: 2.1,
        total: 5,
      },
    },
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* User Info Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                    <AvatarFallback>{userData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-semibold">{userData.name}</h2>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail size={16} />
                      <span>{userData.email}</span>
                    </div>
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Настройки профиля</SheetTitle>
                        <SheetDescription>
                          Настройте свой профиль и предпочтения
                        </SheetDescription>
                      </SheetHeader>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Текущая подписка</CardTitle>
                <Badge variant="default" className="bg-accent-orange">
                  {userData.plan}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Активна до {new Date(userData.subscriptionEnd).toLocaleDateString('ru-RU')}
                  </p>
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
                      {userData.usage.audioMinutes.used} / {userData.usage.audioMinutes.total} мин
                    </span>
                  </div>
                  <Progress 
                    value={(userData.usage.audioMinutes.used / userData.usage.audioMinutes.total) * 100} 
                    className="h-2"
                  />
                </div>

                {/* AI Processing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">AI-обработка</span>
                    <span className="text-sm text-gray-500">
                      {userData.usage.aiProcessing.used} / {userData.usage.aiProcessing.total} операций
                    </span>
                  </div>
                  <Progress 
                    value={(userData.usage.aiProcessing.used / userData.usage.aiProcessing.total) * 100}
                    className="h-2"
                  />
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Хранилище</span>
                    <span className="text-sm text-gray-500">
                      {userData.usage.storage.used} / {userData.usage.storage.total} ГБ
                    </span>
                  </div>
                  <Progress 
                    value={(userData.usage.storage.used / userData.usage.storage.total) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <HelpCircle size={16} />
              <span>Нужна помощь?</span>
              <a href="#" className="text-accent-orange hover:underline">Свяжитесь с поддержкой</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;

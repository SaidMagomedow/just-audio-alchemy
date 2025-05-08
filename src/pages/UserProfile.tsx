import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, HelpCircle, Mail, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth';
import { getUserPlan } from '@/lib/api/userPlan';
import { UserProductPlan } from '@/types/userPlan';
import PricingSection from '@/components/PricingSection';
import axios from 'axios';

const UserProfile = () => {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserProductPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSubscription, setNoSubscription] = useState(false); // Only true if API returns 404
  
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const planData = await getUserPlan();
        setUserPlan(planData);
        setNoSubscription(false);
      } catch (error) {
        console.error('Error fetching user plan:', error);
        // Only set noSubscription to true if it's specifically a 404 error
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setNoSubscription(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPlan();
  }, []);
  
  // Fallback data if API call fails
  const userData = {
    name: user?.name || "Имя пользователя",
    email: user?.email || "alexey@example.com",
    avatarUrl: user?.photoURL,
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

            {loading ? (
              // Show loading state while fetching plan data
              <Card>
                <CardContent className="py-10">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-accent-orange mb-4" />
                    <p className="text-gray-500">Загрузка информации о подписке...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show either subscription details or pricing plans
              <PricingSection userPlan={noSubscription ? null : userPlan} />
            )}

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

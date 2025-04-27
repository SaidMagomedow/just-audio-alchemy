import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import PricingSection from '@/components/PricingSection';
import VideoPreviewSection from '@/components/VideoPreviewSection';
import FAQSection from '@/components/FAQSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';
import PaymentNotification from '@/components/PaymentNotification';
import { getUserPlan } from '@/lib/api/userPlan';
import { UserProductPlan } from '@/types/userPlan';
import axios from 'axios';

const Index = () => {
  const [userPlan, setUserPlan] = useState<UserProductPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const planData = await getUserPlan();
        setUserPlan(planData);
      } catch (error) {
        console.error('Error fetching user plan:', error);
        // Silent fail on homepage - don't show errors to user
      } finally {
        setLoadingPlan(false);
      }
    };
    
    fetchUserPlan();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PaymentNotification />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection userPlan={userPlan} />
        <VideoPreviewSection />
        <TestimonialsSection />
        <FAQSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

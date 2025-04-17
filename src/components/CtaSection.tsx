
import React from 'react';
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-black to-gray-800 text-white">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы упростить свой рабочий процесс?
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Присоединяйтесь к тысячам создателей контента, которые уже используют Just.Audio.AI для трансформации своего аудио и видео контента.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="px-8 py-6 text-lg bg-accent-orange hover:bg-orange-600 text-white">
              Начать бесплатно
            </Button>
            
            <Button variant="outline" className="px-8 py-6 text-lg border-white text-white hover:bg-white/10">
              Посмотреть демо
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;


import React from 'react';
import { Play } from 'lucide-react';

const VideoPreviewSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group">
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
            
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Play size={32} className="text-black ml-1" />
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <p className="text-gray-700 font-medium">
                Давай познакомимся! В видео я подробно расскажу тебе о работе сервиса
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoPreviewSection;

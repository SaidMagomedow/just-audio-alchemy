
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, X } from 'lucide-react';

interface SelectedFile {
  file: File;
  progress: number;
}

const HeroSection = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        progress: 0
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = () => {
    setIsUploading(true);
    
    selectedFiles.forEach((_, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setSelectedFiles(prev => prev.map((file, i) => 
          i === index ? { ...file, progress: Math.min(progress, 100) } : file
        ));

        if (progress >= 100) {
          clearInterval(interval);
          if (index === selectedFiles.length - 1) {
            setIsUploading(false);
          }
        }
      }, 500);
    });
  };

  return (
    <section className="min-h-[90vh] flex items-center pt-20">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-heading">
            <span className="block">Быстрый перевод из</span>
            <span className="block text-accent-orange font-bold">аудио</span>
            <span className="block">в текст всего</span>
            <span className="block text-black">за пару минут</span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            AI-платформа для подкастеров и контент-мейкеров, которая автоматически улучшает и трансформирует ваш аудио-контент.
          </p>
          
          <div className="mt-16 flex flex-col items-center">
            <div className="w-full max-w-xl bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <p className="mb-6 text-center text-gray-600">Перетащите файл сюда или нажмите на кнопку ниже для транскрибации</p>
              
              <div className="flex justify-center">
                <ArrowDown size={32} className="text-black mb-4" />
              </div>
              
              <input
                type="file"
                multiple
                accept="audio/*,video/*"
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
              />
              
              <Button 
                variant="default" 
                className="w-full py-6 text-lg bg-black hover:bg-accent-orange hover:text-white"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Загрузить файл
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="w-full max-w-xl bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm truncate">{file.file.name}</span>
                      {!isUploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>
                ))}
                
                <Button 
                  variant="default"
                  className="w-full bg-black hover:bg-accent-orange hover:text-white"
                  onClick={simulateUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Загрузка..." : "Загрузить"}
                </Button>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Поддерживаются форматы MP3, WAV, MP4, MOV и другие
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

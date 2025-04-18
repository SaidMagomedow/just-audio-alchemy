
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, X, AlertCircle, CheckCircle, FileAudio, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface SelectedFile {
  file: File;
  progress: number;
  uploaded?: boolean;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const HeroSection = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [allUploaded, setAllUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = () => {
    setIsUploading(true);
    
    selectedFiles.forEach((_, index) => {
      setSelectedFiles(prev => 
        prev.map((file, i) => i === index ? { ...file, status: 'uploading' } : file)
      );
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5; // более реалистичный прогресс
        
        setSelectedFiles(prev => prev.map((file, i) => 
          i === index ? { 
            ...file, 
            progress: Math.min(progress, 100),
            status: progress >= 100 ? 'completed' : 'uploading'
          } : file
        ));

        if (progress >= 100) {
          clearInterval(interval);
          
          const allCompleted = selectedFiles.length === index + 1;
          if (allCompleted) {
            setTimeout(() => {
              setIsUploading(false);
              setAllUploaded(true);
            }, 500); // небольшая задержка для лучшего UX
          }
        }
      }, 500);
    });
  };

  const navigateToMyFiles = () => {
    navigate('/my-files');
  };

  const getFileIcon = (file: SelectedFile) => {
    if (file.status === 'error') return <AlertCircle className="text-red-500" size={18} />;
    if (file.status === 'completed') return <CheckCircle className="text-green-500" size={18} />;
    if (file.status === 'uploading') return <Clock className="text-blue-500 animate-pulse" size={18} />;
    return <FileAudio className="text-gray-500" size={18} />;
  };

  const getStatusText = (file: SelectedFile) => {
    switch (file.status) {
      case 'error': return <span className="text-red-500 text-xs">Ошибка</span>;
      case 'completed': return <span className="text-green-500 text-xs">Готово</span>;
      case 'uploading': return <span className="text-blue-500 text-xs">{file.progress}%</span>;
      default: return <span className="text-gray-500 text-xs">В очереди</span>;
    }
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
          
          <p className="text-sm text-accent-orange font-medium mt-4 mb-2">
            Поддерживаются форматы MP3, WAV, MP4, MOV и другие
          </p>
          
          <div className="mt-8 flex flex-col items-center">
            <div 
              className={cn(
                "w-full max-w-xl bg-white rounded-lg border-2 border-dashed p-6 mb-6 transition-all duration-300",
                dragActive ? "border-accent-orange bg-accent-light/20" : "border-gray-200 hover:border-accent-orange/50 hover:bg-accent-light/10",
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <p className="mb-6 text-center text-gray-600">Перетащите файл сюда или нажмите на кнопку ниже для транскрибации</p>
              
              <div className="flex justify-center">
                <ArrowDown size={32} className="text-accent-orange mb-4 animate-bounce" />
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
                className="w-full py-5 text-lg bg-black hover:bg-accent-orange hover:text-white rounded-lg transition-all"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Загрузить файл
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="w-full max-w-xl bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fade-in">
                <div className="text-sm font-medium text-gray-700 mb-2">Выбранные файлы ({selectedFiles.length})</div>
                
                <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file)}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[300px]">
                              {file.file.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.file.size)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {file.file.type.split('/')[1]?.toUpperCase() || 'Аудио файл'}
                              </span>
                              {getStatusText(file)}
                            </div>
                          </div>
                        </div>
                        
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Progress value={file.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="default"
                  className={cn(
                    "w-full py-2.5 rounded-lg transition-all shadow-sm",
                    allUploaded 
                      ? "bg-accent-orange text-white hover:bg-accent-orange/90" 
                      : "bg-black hover:bg-accent-orange hover:text-white"
                  )}
                  onClick={allUploaded ? navigateToMyFiles : simulateUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Загрузка..." : allUploaded ? "Перейти к моим файлам" : "Загрузить"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

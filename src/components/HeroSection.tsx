import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, X, AlertCircle, CheckCircle, FileAudio, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getUserPlan } from '@/lib/api/userPlan';
import { UserProductPlan } from '@/types/userPlan';
import { isAuthenticated } from '@/lib/auth';
import AuthRequiredModal from './modals/AuthRequiredModal';

interface SelectedFile {
  file: File;
  progress: number;
  uploaded?: boolean;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  fileId?: number;
}

interface ProcessingFile {
  id: number;
  user_id: number;
  file_url: string;
  status: string;
  display_name: string;
  external_id?: string;
  created_at: string;
  file_size?: number;
  mime_type?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const HeroSection = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allUploaded, setAllUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [userPlan, setUserPlan] = useState<UserProductPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Загрузка данных о плане пользователя
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const planData = await getUserPlan();
        setUserPlan(planData);
      } catch (error) {
        console.error('Error fetching user plan:', error);
        // No need to show error to user on homepage, 
        // just silently fail and don't display the plan info
      } finally {
        setLoadingPlan(false);
      }
    };
    
    fetchUserPlan();
  }, []);

  // Загрузка файлов в обработке при монтировании компонента
  useEffect(() => {
    const fetchProcessingFiles = async () => {
      try {
        // Используем наш API интерцептор
        const response = await api.get('/user-files', {
          params: {
            status: 'uploaded'
          }
        });
        
        if (response.data && response.data.items) {
          setProcessingFiles(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching processing files:', error);
        toast({
          title: "Ошибка загрузки", 
          description: "Не удалось загрузить обрабатываемые файлы.",
          variant: "destructive",
        });
      }
    };
    // Загружаем файлы для обработки если пользователь аутентифицирован
    if (isAuthenticated()) {
      fetchProcessingFiles();
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (allUploaded) {
        setAllUploaded(false);
      }
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
      if (allUploaded) {
        setAllUploaded(false);
      }
    }
  }, [allUploaded]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: SelectedFile, index: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      
      const response = await api.post('/audio/convert/file/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setSelectedFiles(prev => prev.map((f, i) => 
              i === index ? { 
                ...f, 
                progress: percentCompleted,
                status: 'uploading'
              } : f
            ));
          }
        }
      });
      
      // Обновляем информацию о файле после успешной загрузки
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          progress: 100,
          status: 'completed',
          fileId: response.data.file_id
        } : f
      ));
      
      return response.data.file_id;
    } catch (error) {
      console.error('Error uploading file:', error);
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error'
        } : f
      ));
      
      // Показываем уведомление об ошибке, если доступен компонент toast
      if (toast) {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить файл. Попробуйте еще раз.",
          variant: "destructive",
        });
      }
      
      return null;
    }
  };

  const startTranscription = async (fileIds: number[]) => {
    try {
      await api.post('/audio/convert/file/transcription', {
        file_ids: fileIds
      });
    } catch (error) {
      console.error('Error starting transcription:', error);
      
      // Показываем уведомление об ошибке, если доступен компонент toast
      if (toast) {
        toast({
          title: "Ошибка транскрибации",
          description: "Файлы загружены, но не удалось начать транскрибацию. Обратитесь в поддержку.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    // Проверяем, есть ли файлы, ожидающие загрузки
    const pendingFiles = selectedFiles.filter(file => file.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    
    setIsUploading(true);
    const fileIds: number[] = [];
    
    // Загружаем только файлы, ожидающие загрузки
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].status === 'pending') {
        const fileId = await uploadFile(selectedFiles[i], i);
        if (fileId) {
          fileIds.push(fileId);
        }
      }
    }
    
    setIsUploading(false);
    
    // Проверяем, все ли файлы загружены (после текущей операции)
    const allFilesCompleted = selectedFiles.every(file => 
      file.status === 'completed' || file.status === 'error'
    );
    
    // Если все файлы загружены и мы загрузили хотя бы один в этой операции
    if (allFilesCompleted) {
      setAllUploaded(true);
    }
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
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

  // Преобразование processingFiles в формат SelectedFile для отображения
  const getDisplayFiles = () => {
    // Создаем файлы из processingFiles и добавляем в массив выбранных файлов
    const processedFiles: SelectedFile[] = processingFiles.map(pFile => {
      // Определяем MIME-тип: либо из API, либо на основе расширения файла
      let mimeType = pFile.mime_type;
      if (!mimeType) {
        // Получаем расширение файла из URL или имени файла
        const fileType = pFile.file_url.split('.').pop()?.toLowerCase() || 'unknown';
        const mimeTypeMap: {[key: string]: string} = {
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'mp4': 'video/mp4',
          'mov': 'video/quicktime',
          'aac': 'audio/aac',
          'ogg': 'audio/ogg',
          'webm': 'audio/webm',
          'flac': 'audio/flac'
        };
        mimeType = mimeTypeMap[fileType] || 'audio/unknown';
      }
      
      // Создаем File-подобный объект с возможностью получения имени и типа
      const dummyFile = new File([], pFile.display_name, {
        type: mimeType
      });
      
      // Хак для установки size, так как File не позволяет напрямую изменять
      Object.defineProperty(dummyFile, 'size', {
        value: pFile.file_size || 0,
        writable: false
      });
      
      return {
        file: dummyFile,
        progress: 100, // Файлы в обработке уже загружены
        status: 'uploading', // Используем 'uploading' для файлов в состоянии 'processing'
        fileId: pFile.id
      };
    });
    
    // Объединяем файлы из выбранных файлов и файлов в обработке
    return [...selectedFiles, ...processedFiles];
  };

  // Новая функция для запуска транскрибации файлов в обработке
  const startProcessingFiles = async () => {
    if (processingFiles.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const fileIds = processingFiles.map(file => file.id);
      
      await api.post('/audio/convert/file/transcription', {
        file_ids: fileIds
      });
      
      toast({
        title: "Транскрибация запущена",
        description: `Запущена обработка ${fileIds.length} файлов. Это может занять некоторое время.`,
      });
      
      // Перенаправляем на страницу с файлами
      navigate('/my-files');
      
    } catch (error) {
      console.error('Error starting transcription:', error);
      toast({
        title: "Ошибка запуска транскрибации",
        description: "Не удалось запустить процесс транскрибации. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Определяем, должна ли кнопка показывать состояние "Запустить Audio.AI"
  const shouldShowLaunchButton = () => {
    return (selectedFiles.length > 0 && selectedFiles.every(file => file.status === 'completed' || file.status === 'error')) || 
           (processingFiles.length > 0 && selectedFiles.length === 0);
  };

  // Определяем, какой обработчик использовать для кнопки
  const handleButtonClick = () => {
    if (shouldShowLaunchButton()) {
      if (processingFiles.length > 0 && selectedFiles.length === 0) {
        // Check if user is authenticated before starting processing
        if (!isAuthenticated()) {
          setShowAuthModal(true);
          return;
        }
        startProcessingFiles();
      } else {
        navigateToMyFiles();
      }
    } else {
      handleUpload();
    }
  };

  // Определяем текст для кнопки
  const getButtonText = () => {
    if (isUploading || isProcessing) {
      return "Загрузка...";
    } else if (shouldShowLaunchButton()) {
      return "Запустить Audio.AI";
    } else {
      return "Загрузить";
    }
  };

  return (
    <section className="relative bg-gray-50 py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Ваш <span style={{ color: '#FF7A00' }}>аудио</span>-инженер на базе AI</h1>
          <p className="text-xl text-gray-600 mb-8">
            Улучшайте качество до студийного, удаляйте шумы, разделяйте вокал и фон, получайте транскрипцию и субтитры — быстро и точно.
          </p>
          
          {isAuthenticated() && userPlan && (
            <div className="mb-6 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-accent-orange" />
                  <span className="font-medium">Ваш план: {userPlan.is_subscription ? 'Подписка' : 'Разовый план'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Использовано: </span>
                    <span className="font-medium">{userPlan.minute_count_used} / {userPlan.minute_count_limit} мин</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                    Подробнее
                  </Button>
                </div>
              </div>
              {userPlan.minute_count_limit > 0 && (
                <Progress 
                  className="h-1 mt-2" 
                  value={(userPlan.minute_count_used / userPlan.minute_count_limit) * 100} 
                />
              )}
            </div>
          )}
          
          {/* File uploader */}
          <div 
            className={cn(
              "mt-8 border-2 border-dashed rounded-xl p-8 transition-colors",
              dragActive ? "border-accent-orange bg-orange-50" : "border-gray-200 hover:border-gray-300",
              isUploading || processingFiles.length > 0 ? "border-gray-200 bg-white shadow-sm" : ""
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

          {(selectedFiles.length > 0 || processingFiles.length > 0) && (
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fade-in">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Выбранные файлы ({getDisplayFiles().length})
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                {getDisplayFiles().map((file, index) => {
                  // Создаем действительно уникальный ключ для каждого файла
                  const uniqueKey = file.fileId ? `server-${file.fileId}` : `local-${index}`;
                  return (
                    <div key={uniqueKey} className="relative bg-gray-50 rounded-lg p-3">
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
                        
                        {!isUploading && !file.fileId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              // Находим правильный индекс в selectedFiles
                              const selectedIndex = selectedFiles.findIndex(
                                f => f.file.name === file.file.name && f.status === file.status
                              );
                              if (selectedIndex !== -1) {
                                removeFile(selectedIndex);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Progress value={file.progress} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
              
              <Button 
                variant="default"
                style={{
                  backgroundColor: isUploading || isProcessing ? 'black' : 
                                  shouldShowLaunchButton() ? '#FF7A00' : 'black',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
                className={cn(
                  "w-full py-2.5 rounded-lg shadow-sm !text-white",
                  "hover:!bg-accent-orange hover:text-white"
                )}
                onClick={handleButtonClick}
                disabled={isUploading || isProcessing}
              >
                {getButtonText()}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add authentication modal */}
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={handleCloseAuthModal} 
        action="загрузить файлы"
      />
    </section>
  );
};

export default HeroSection;

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileList, { TranscribedFile } from '@/components/files/FileList';
import FileDetails from '@/components/files/FileDetails';
import { Message } from '@/components/files/ChatInterface';
import { initialMessages } from '@/data/mockFiles';
import api from '@/lib/api';

// Интерфейс для файла с бэкенда
interface ApiFile {
  id: number;
  user_id: number;
  file_url: string;
  status: string;
  display_name: string;
  external_id?: string;
  created_at: string;
  file_size?: number;
  mime_type?: string;
  transcription?: any;
  duration?: number;
}

const MyFiles: React.FC = () => {
  const [files, setFiles] = useState<TranscribedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<TranscribedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем файлы с API
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        
        const response = await api.get('/user-files/detail');
        
        if (response.data && response.data.items) {
          // Преобразуем данные API в формат, подходящий для компонента
          const transformedFiles: TranscribedFile[] = response.data.items.map((file: ApiFile) => ({
            id: file.id.toString(),
            name: file.display_name,
            date: new Date(file.created_at),
            duration: formatDuration(file.duration || 0),
            audioUrl: file.file_url,
            status: mapApiStatus(file.status),
            transcription: file.transcription,
            fileSize: file.file_size,
            mimeType: file.mime_type
          }));
          
          setFiles(transformedFiles);
          
          // Если файлов нет, показываем соответствующее сообщение
          if (transformedFiles.length === 0) {
            setError('Нет доступных файлов');
          } else {
            setError(null);
          }
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        setError('Ошибка загрузки файлов');
        toast.error('Не удалось загрузить файлы');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Преобразуем статус API в формат, используемый в компоненте
  const mapApiStatus = (apiStatus: string): 'completed' | 'processing' | 'error' => {
    switch(apiStatus.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'processing':
      case 'uploaded':
        return 'processing';
      default:
        return 'error';
    }
  };

  // Форматируем длительность из секунд в формат MM:SS или HH:MM:SS
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const handleFileSelect = (file: TranscribedFile) => {
    setSelectedFile(file);
    setShowChat(false); // Default to audio player, not chat
    // Reset messages for new file
    setMessages(initialMessages);
  };

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate server response
    setTimeout(() => {
      const serverResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Я обработал ваш запрос по файлу "${selectedFile?.name}". Могу предложить оптимизировать текст и улучшить его структуру. Что-нибудь еще?`,
        type: 'server',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, serverResponse]);
    }, 1000);
  };

  // Handlers for file actions
  const handleOpenAssistant = () => {
    setShowChat(true);
    toast.success(`Открыт GPT ассистент для файла "${selectedFile?.name}"`);
  };

  const handleRemoveNoise = () => {
    toast.success(`Запущено удаление шума из "${selectedFile?.name}"`);
  };

  const handleRemoveMelody = () => {
    toast.success(`Запущено удаление мелодии из "${selectedFile?.name}"`);
  };

  const handleRemoveVocals = () => {
    toast.success(`Запущено удаление вокала из "${selectedFile?.name}"`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20 container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Мои файлы</h1>

        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-250px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
          </div>
        ) : error && files.length === 0 ? (
          <div className="flex justify-center items-center h-[calc(100vh-250px)]">
            <div className="text-gray-500 text-center">
              <p className="mb-4">{error}</p>
              <p>Загрузите файлы на главной странице</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 mb-8 min-h-[calc(100vh-250px)]">
            {/* List of files */}
            <FileList 
              files={files}
              selectedFileId={selectedFile?.id || null}
              onFileSelect={handleFileSelect}
            />
            
            {/* File details panel (audio player, transcription or chat) */}
            <FileDetails 
              selectedFile={selectedFile}
              showChat={showChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              onOpenAssistant={handleOpenAssistant}
              onRemoveNoise={handleRemoveNoise}
              onRemoveMelody={handleRemoveMelody}
              onRemoveVocals={handleRemoveVocals}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyFiles;

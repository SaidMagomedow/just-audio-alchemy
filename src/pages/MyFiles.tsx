import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileList, { TranscribedFile } from '@/components/files/FileList';
import FileDetails from '@/components/files/FileDetails';
import { Message } from '@/components/files/ChatInterface';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
  transcription_text?: string;
  transcription_vtt?: string;
  transcription_srt?: string;
  transcription_status?: string;
  duration?: number;
  removed_noise_file_url?: string;
  removed_melody_file_url?: string;
  removed_vocals_file_url?: string;
  improved_audio_file_url?: string;
  removed_noise_file_status?: string;
  removed_melody_file_status?: string;
  removed_vocal_file_status?: string;
  improved_audio_file_status?: string;
}

// Вспомогательная функция для надежного приведения типов статусов
function mapProcessingStatus(status: string | undefined): 'not started' | 'processing' | 'completed' | 'failed' {
  if (!status) return 'not started';
  
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'processing') return 'processing';
  if (normalizedStatus === 'completed') return 'completed';
  if (normalizedStatus === 'failed') return 'failed';
  return 'not started';
}

const MyFiles: React.FC = () => {
  const [files, setFiles] = useState<TranscribedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<TranscribedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
    }
  }, [navigate]);

  // Загружаем файлы с API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/user-files/detail');
      
      if (response.data && response.data.items) {
        // Преобразуем данные API в формат, подходящий для компонента
        const transformedFiles: TranscribedFile[] = response.data.items.map((file: ApiFile) => {
          console.log(`File ${file.id} improve audio status:`, file.improved_audio_file_status);
          
          // Преобразование статусов через вспомогательную функцию
          const fileImproveAudioStatus = mapProcessingStatus(file.improved_audio_file_status);
          const fileRemoveNoiseStatus = mapProcessingStatus(file.removed_noise_file_status);
          const fileRemoveMelodyStatus = mapProcessingStatus(file.removed_melody_file_status);
          const fileRemoveVocalStatus = mapProcessingStatus(file.removed_vocal_file_status); 
          const fileTranscriptionStatus = mapProcessingStatus(file.transcription_status);
          
          console.log(`File ${file.id} mapped improve audio status:`, fileImproveAudioStatus);
          
          return {
            id: file.id.toString(),
            name: file.display_name,
            date: new Date(file.created_at),
            duration: formatDuration(file.duration || 0),
            audioUrl: file.file_url,
            status: mapApiStatus(file.status),
            transcription: file.transcription,
            transcription_text: file.transcription_text,
            transcription_vtt: file.transcription_vtt,
            transcription_srt: file.transcription_srt,
            fileSize: file.file_size,
            mimeType: file.mime_type,
            removedNoiseFileUrl: file.removed_noise_file_url,
            removedMelodyFileUrl: file.removed_melody_file_url,
            removedVocalsFileUrl: file.removed_vocals_file_url,
            enhancedAudioFileUrl: file.improved_audio_file_url,
            removed_noise_file_url: file.removed_noise_file_url,
            removed_melody_file_url: file.removed_melody_file_url,
            removed_vocals_file_url: file.removed_vocals_file_url,
            enhanced_audio_file_url: file.improved_audio_file_url,
            fileRemoveNoiseStatus,
            fileRemoveMelodyStatus,
            fileRemoveVocalStatus,
            fileImproveAudioStatus,
            fileTranscriptionStatus
          };
        });
        
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

  useEffect(() => {
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
    // Reset messages when selecting a new file
    setMessages([]);
  };

  // This is a dummy method now - our chat is handled directly in FileDetails component
  const handleSendMessage = (content: string) => {
    // Do nothing - this is just to satisfy the props contract
    // Actual chat handling is done in FileDetails component
  };

  // Handlers for file actions
  const handleOpenAssistant = () => {
    setShowChat(true);
    toast.success(`Открыт GPT ассистент для файла "${selectedFile?.name}"`);
  };

  const handleRemoveNoise = async () => {
    if (!selectedFile) return;
    
    toast.success(`Запущено удаление шума из "${selectedFile?.name}"`);
    
    // Сразу устанавливаем локальный статус в "processing"
    const updatedFile: TranscribedFile = {
      ...selectedFile,
      fileRemoveNoiseStatus: 'processing'
    };
    
    setSelectedFile(updatedFile);
    
    // Обновляем файл в общем списке
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === selectedFile.id ? updatedFile : file
      )
    );
    
  };

  const handleRemoveMelody = async () => {
    if (!selectedFile) return;
    
    toast.success(`Запущено удаление мелодии из "${selectedFile?.name}"`);
    
    // Сразу устанавливаем локальный статус в "processing"
    const updatedFile: TranscribedFile = {
      ...selectedFile,
      fileRemoveMelodyStatus: 'processing'
    };
    
    setSelectedFile(updatedFile);
    
    // Обновляем файл в общем списке
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === selectedFile.id ? updatedFile : file
      )
    );

  };

  const handleRemoveVocals = async () => {
    if (!selectedFile) return;
    
    toast.success(`Запущено удаление вокала из "${selectedFile?.name}"`);
    
    // Сразу устанавливаем локальный статус в "processing"
    const updatedFile: TranscribedFile = {
      ...selectedFile,
      fileRemoveVocalStatus: 'processing'
    };
    
    setSelectedFile(updatedFile);
    
    // Обновляем файл в общем списке
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === selectedFile.id ? updatedFile : file
      )
    );

  };

  const handleEnhanceAudio = async () => {
    if (!selectedFile) return;
    
    toast.success(`Запущено улучшение звука для "${selectedFile?.name}"`);
    
    // Сразу устанавливаем локальный статус в "processing"
    const updatedFile: TranscribedFile = {
      ...selectedFile,
      fileImproveAudioStatus: 'processing'
    };
    
    setSelectedFile(updatedFile);
    
    // Обновляем файл в общем списке
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === selectedFile.id ? updatedFile : file
      )
    );
  };

  // Handler for newly uploaded files
  const handleNewFileLoaded = (fileData: any) => {
    // Получаем новую информацию о только что загруженном файле
    const newFile: TranscribedFile = {
      id: fileData.file_id.toString(),
      name: fileData.display_filename || 'Новый файл',
      date: new Date(),
      duration: '00:00', // Длительность может быть неизвестна сразу после загрузки
      audioUrl: fileData.file_url || '',
      status: 'processing',
      fileSize: fileData.file_size,
      mimeType: fileData.mime_type,
      fileTranscriptionStatus: 'not started'
    };
    console.log('newFile', fileData);
    // Добавляем файл в общий список
    setFiles(prevFiles => [newFile, ...prevFiles]);
    
    // Уведомление о успешной загрузке
    toast.success(`Файл "${newFile.name}" успешно загружен и отправлен на обработку`);
  };
  
  // Handler to refresh file list
  const handleRefreshFiles = async () => {
    await fetchFiles();
    toast.success('Список файлов обновлен');
  };

  // Early return if not authenticated to avoid API calls
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-20 container mx-auto px-4">
          <div className="flex justify-center items-center h-[calc(100vh-250px)]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-accent-orange" />
              <p className="text-gray-500">Перенаправление на страницу авторизации...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          <div className="flex flex-col md:flex-row gap-6 mb-8 min-h-[calc(100vh-150px)]">
            {/* List of files */}
            <FileList 
              files={files}
              selectedFileId={selectedFile?.id || null}
              onFileSelect={handleFileSelect}
              onNewFileLoaded={handleNewFileLoaded}
              onRefreshFiles={handleRefreshFiles}
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
              onEnhanceAudio={handleEnhanceAudio}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyFiles;

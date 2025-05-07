import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribedFile } from './FileList';
import { Message } from './ChatInterface';
import FileHeader from './FileHeader';
import AudioPlayer from './AudioPlayer';
import ChatInterface, { GptModel } from './ChatInterface';
import Transcription from './Transcription';
import api from '@/lib/api';
import { getUserPlan } from '@/lib/api/userPlan';
import { UserProductPlan } from '@/types/userPlan';
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Loader2, Lock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpgradePlanModal from '../modals/UpgradePlanModal';

interface FileDetailsProps {
  selectedFile: TranscribedFile | null;
  showChat: boolean;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({
  selectedFile,
  showChat,
  messages,
  onSendMessage,
  onOpenAssistant,
  onRemoveNoise,
  onRemoveMelody,
  onRemoveVocals
}) => {
  const [activeTab, setActiveTab] = useState<string>("audio");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [limitExceeded, setLimitExceeded] = useState<boolean>(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Состояние для хранения детальной информации о файле
  const [fileDetails, setFileDetails] = useState<TranscribedFile | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [errorLoadingDetails, setErrorLoadingDetails] = useState<string>("");
  
  // Состояние для хранения информации о плане пользователя
  const [userPlan, setUserPlan] = useState<UserProductPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
  
  // Модальное окно для предложения улучшить подписку
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [featureToUpgrade, setFeatureToUpgrade] = useState('');
  
  // Добавляем состояние для отслеживания статуса транскрипции
  const [localTranscriptionStatus, setLocalTranscriptionStatus] = useState<string>('not started');
  
  // Проверка доступности GPT
  const canUseGpt = !!userPlan?.is_can_use_gpt;
  
  // Флаг для контроля автоматической прокрутки при переключении вкладок
  const [isTabSwitched, setIsTabSwitched] = useState<boolean>(false);
  
  // Изменяем обработчик смены вкладки
  const handleTabChange = (tab: string) => {
    // Проверяем доступность GPT
    if (tab === "chat" && !canUseGpt) {
      setFeatureToUpgrade('GPT-ассистент');
      setShowUpgradeModal(true);
      return;
    }
    
    if (tab === "chat") {
      setIsTabSwitched(true);
      // Сбрасываем флаг через некоторое время, чтобы автопрокрутка возобновилась
      // после отправки новых сообщений
      setTimeout(() => {
        setIsTabSwitched(false);
      }, 1000);
    }
    setActiveTab(tab);
  };

  // Fetch file details when selecting a file
  useEffect(() => {
    if (selectedFile) {
      fetchFileDetails();
    } else {
      setFileDetails(null);
      setLocalTranscriptionStatus('not started');
    }
  }, [selectedFile?.id]);

  // Fetch user plan information
  useEffect(() => {
    fetchUserPlan();
  }, []);

  // Fetch chat history when selecting a file or when tab is changed to chat
  useEffect(() => {
    if (selectedFile && (activeTab === "chat" || showChat)) {
      fetchChatHistory();
    }
  }, [selectedFile?.id, activeTab, showChat]);

  // Синхронизируем localTranscriptionStatus с данными файла при их изменении
  useEffect(() => {
    if (fileDetails && fileDetails.fileTranscriptionStatus) {
      // Только если текущий статус не 'processing' (чтобы не сбрасывать статус во время обработки)
      if (localTranscriptionStatus !== 'processing') {
        setLocalTranscriptionStatus(fileDetails.fileTranscriptionStatus);
      }
    } else if (selectedFile && selectedFile.fileTranscriptionStatus) {
      // Если у нас нет fileDetails, но есть selectedFile
      if (localTranscriptionStatus !== 'processing') {
        setLocalTranscriptionStatus(selectedFile.fileTranscriptionStatus);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileDetails?.fileTranscriptionStatus, selectedFile?.fileTranscriptionStatus]);

  // Function to fetch file details
  const fetchFileDetails = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoadingDetails(true);
      setErrorLoadingDetails("");
      
      const response = await api.get(`/user-files/${selectedFile.id}/detail`);
      
      if (response.data) {
        // Transform API response to the TranscribedFile format
        const details: TranscribedFile = {
          id: response.data.id.toString(),
          name: response.data.display_name,
          date: new Date(response.data.created_at),
          duration: formatDuration(response.data.duration || 0),
          audioUrl: response.data.file_url,
          status: mapApiStatus(response.data.status),
          transcription: response.data.transcription,
          transcription_text: response.data.transcription_text,
          transcription_vtt: response.data.transcription_vtt,
          transcription_srt: response.data.transcription_srt,
          fileSize: response.data.file_size,
          mimeType: response.data.mime_type,
          removedNoiseFileUrl: response.data.removed_noise_file_url,
          removedMelodyFileUrl: response.data.removed_melody_file_url,
          removedVocalsFileUrl: response.data.removed_vocals_file_url,
          fileRemoveNoiseStatus: response.data.removed_noise_file_status,
          fileRemoveMelodyStatus: response.data.removed_melody_file_status,
          fileRemoveVocalStatus: response.data.removed_vocal_file_status,
          fileTranscriptionStatus: response.data.transcription_status || 'not started'
        };
        
        setFileDetails(details);
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setErrorLoadingDetails("Не удалось загрузить детальную информацию о файле");
      toast.error("Ошибка при загрузке файла");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to fetch user plan information
  const fetchUserPlan = async () => {
    try {
      setIsLoadingPlan(true);
      const plan = await getUserPlan();
      setUserPlan(plan);
    } catch (error) {
      console.error('Ошибка при загрузке информации о подписке:', error);
      // При ошибке оставляем userPlan как null
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Function to fetch chat history
  const fetchChatHistory = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoadingChat(true);
      setLimitExceeded(false); // Сбрасываем флаг ошибки при новой загрузке
      const response = await api.get(`/chat/${selectedFile.id}`);
      
      if (response.data && response.data.messages) {
        // Transform API messages to the format needed by ChatInterface
        const transformedMessages: Message[] = response.data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setChatMessages(transformedMessages);
      } else {
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Function to send a message to the API
  const handleSendMessage = async (messageText: string, model: GptModel = 'high-speed') => {
    if (!selectedFile) return;
    
    // Create a temporary message
    const tempMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    // Add to UI immediately
    setChatMessages(prev => [...prev, tempMessage]);
    
    try {
      // Send message to API with selected model
      const response = await api.post(`/chat/${selectedFile.id}`, {
        message: messageText,
        model: model // Добавляем модель в запрос
      });
      
      // Проверяем наличие ошибки
      if (response.data.error) {
        setLimitExceeded(response.data.limit_exceeded);
        setLimitErrorMessage(response.data.message);
        
        // Добавляем сообщение об ошибке как сообщение от ассистента
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
        
        // Также показываем уведомление
        toast.error(response.data.message);
        return;
      }
      
      // Сбрасываем флаг ошибки, если ответ успешный
      setLimitExceeded(false);
      
      // Add assistant response
      if (response.data && response.data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка при отправке сообщения');
    }
  };
  
  // Получаем транскрипцию из данных файла или используем пустую строку
  const getTranscription = (): string => {
    // Используем данные из fileDetails, если они есть
    const fileToUse = fileDetails || selectedFile;
    
    if (!fileToUse || !fileToUse.transcription) return '';
    
    // Если у нас есть транскрипция из API, преобразуем ее в нужный формат
    if (typeof fileToUse.transcription === 'object') {
      try {
        // Формат вида: "[timestamp] текст"
        if (fileToUse.transcription.segments) {
          return fileToUse.transcription.segments
            .map((segment: any) => {
              const startTime = Math.floor(segment.start);
              const minutes = Math.floor(startTime / 60);
              const seconds = Math.floor(startTime % 60);
              const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              return `[${timestamp}] ${segment.text}`;
            })
            .join('\n');
        }
        // Если формат другой, возвращаем JSON строкой
        return JSON.stringify(fileToUse.transcription, null, 2);
      } catch (e) {
        console.error('Error parsing transcription:', e);
        return 'Ошибка при обработке транскрипции';
      }
    }
    
    // Если транскрипция уже строка, возвращаем ее
    return fileToUse.transcription.toString();
  };
  
  // Send selection to GPT chat
  const handleSendToGPT = (text: string) => {
    // Проверяем доступность GPT
    if (!canUseGpt) {
      setFeatureToUpgrade('GPT-ассистент');
      setShowUpgradeModal(true);
      return;
    }
    
    handleSendMessage(`Анализ текста: ${text.slice(0, 100)}...`);
    setActiveTab("chat");
  };

  // Обработчик изменения статуса транскрипции
  const handleTranscriptionStatusChange = (status: string) => {
    setLocalTranscriptionStatus(status);
  };

  // Форматирование длительности в минуты:секунды
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Преобразование статуса API в статус для UI
  const mapApiStatus = (status: string): 'completed' | 'processing' | 'error' => {
    if (status === 'COMPLETED') return 'completed';
    if (status === 'PROCESSING') return 'processing';
    return 'error';
  };

  // Обработчик закрытия модального окна
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  if (!selectedFile) {
    return (
      <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 flex justify-center items-center p-8">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <p>Выберите файл из списка слева</p>
            <p className="text-sm mt-1">или загрузите новый файл на главной странице</p>
          </div>
        </div>
      </div>
    );
  }

  // Отображаем загрузку, пока данные загружаются
  if (isLoadingDetails) {
    return (
      <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex items-center justify-center h-full text-gray-500 p-10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Загрузка информации о файле...</p>
        </div>
      </div>
    );
  }

  // Используем данные из fileDetails, если они есть, или из selectedFile в противном случае
  const fileToDisplay = fileDetails || selectedFile;

  return (
    <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col h-[calc(100vh-100px)]">
      <FileHeader 
        file={fileToDisplay}
        onOpenAssistant={() => {
          // Проверяем доступность GPT перед открытием ассистента
          if (!canUseGpt) {
            setFeatureToUpgrade('GPT-ассистент');
            setShowUpgradeModal(true);
            return;
          }
          
          onOpenAssistant();
          setIsTabSwitched(true);
          setActiveTab("chat");
          // Сбрасываем флаг через некоторое время
          setTimeout(() => {
            setIsTabSwitched(false);
          }, 1000);
        }}
        onRemoveNoise={onRemoveNoise}
        onRemoveMelody={onRemoveMelody}
        onRemoveVocals={onRemoveVocals}
      />
      
      {errorLoadingDetails && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>{errorLoadingDetails}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={showChat && canUseGpt ? "chat" : activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="audio">Аудио</TabsTrigger>
          <TabsTrigger value="transcription">Расшифровка</TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1">
            GPT-ассистент
            {!canUseGpt && <Lock className="h-3 w-3" />}
          </TabsTrigger>
        </TabsList>
        
        {activeTab === "audio" && (
          <div className="flex-1 flex">
            <AudioPlayer 
              file={fileToDisplay}
              onOpenAssistant={() => {
                // Проверяем доступность GPT перед открытием ассистента
                if (!canUseGpt) {
                  setFeatureToUpgrade('GPT-ассистент');
                  setShowUpgradeModal(true);
                  return;
                }
                
                onOpenAssistant();
                setActiveTab("chat");
              }}
              onRemoveNoise={onRemoveNoise}
              onRemoveMelody={onRemoveMelody}
              onRemoveVocals={onRemoveVocals}
              userPlan={userPlan}
            />
          </div>
        )}
        
        {activeTab === "transcription" && (
          <div className="flex-1 overflow-y-auto">
            <Transcription 
              fileId={fileToDisplay.id}
              transcription={fileToDisplay.transcription}
              transcriptionText={fileToDisplay.transcription_text}
              transcriptionVtt={fileToDisplay.transcription_vtt}
              transcriptionSrt={fileToDisplay.transcription_srt}
              transcriptionStatus={localTranscriptionStatus}
              onSendToGPT={handleSendToGPT}
              userPlan={userPlan}
              onTranscriptionStatusChange={handleTranscriptionStatusChange}
            />
          </div>
        )}
        
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col bg-white min-h-0">
            {limitExceeded && (
              <Alert variant="destructive" className="mx-4 mt-2 mb-2 flex-shrink-0">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ограничение GPT-ассистента</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p>{limitErrorMessage}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open('/pricing', '_blank')}>
                      Обновить подписку <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex-1 min-h-0">
              <ChatInterface 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                fileName={fileToDisplay.name}
                transcriptionContext={getTranscription()}
                isLoading={isLoadingChat}
                isLimitExceeded={limitExceeded}
                disableAutoScroll={isTabSwitched}
                userPlan={userPlan}
              />
            </div>
          </div>
        )}
      </Tabs>
      
      {/* Модальное окно для улучшения подписки */}
      <UpgradePlanModal 
        isOpen={showUpgradeModal} 
        onClose={handleCloseUpgradeModal} 
        feature={featureToUpgrade}
      />
    </div>
  );
};

export default FileDetails;

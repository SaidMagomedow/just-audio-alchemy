import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribedFile } from './FileList';
import { Message } from './ChatInterface';
import FileHeader from './FileHeader';
import AudioPlayer from './AudioPlayer';
import ChatInterface from './ChatInterface';
import Transcription from './Transcription';
import api from '@/lib/api';
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  // Флаг для контроля автоматической прокрутки при переключении вкладок
  const [isTabSwitched, setIsTabSwitched] = useState<boolean>(false);
  
  // Изменяем обработчик смены вкладки
  const handleTabChange = (tab: string) => {
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
    }
  }, [selectedFile?.id]);

  // Fetch chat history when selecting a file or when tab is changed to chat
  useEffect(() => {
    if (selectedFile && (activeTab === "chat" || showChat)) {
      fetchChatHistory();
    }
  }, [selectedFile?.id, activeTab, showChat]);

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
  const handleSendMessage = async (messageText: string) => {
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
      // Send message to API
      const response = await api.post(`/chat/${selectedFile.id}`, {
        message: messageText
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
    handleSendMessage(`Анализ текста: ${text.slice(0, 100)}...`);
    setActiveTab("chat");
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

  if (!selectedFile) {
    return (
      <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex items-center justify-center h-full text-gray-500 p-10">
        Выберите файл для прослушивания
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
    <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col h-full" style={{ height: "calc(100vh - 200px)" }}>
      <FileHeader 
        file={fileToDisplay}
        onOpenAssistant={() => {
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
      
      <Tabs value={showChat ? "chat" : activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col h-full">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="audio">Аудио</TabsTrigger>
          <TabsTrigger value="transcription">Расшифровка</TabsTrigger>
          <TabsTrigger value="chat">GPT-ассистент</TabsTrigger>
        </TabsList>
        
        {activeTab === "audio" && (
          <div className="flex-1 flex">
            <AudioPlayer 
              file={fileToDisplay}
              onOpenAssistant={() => {
                onOpenAssistant();
                setActiveTab("chat");
              }}
              onRemoveNoise={onRemoveNoise}
              onRemoveMelody={onRemoveMelody}
              onRemoveVocals={onRemoveVocals}
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
              onSendToGPT={handleSendToGPT}
            />
          </div>
        )}
        
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-full" style={{ minHeight: "600px" }}>
            {limitExceeded && (
              <Alert variant="destructive" className="mx-4 mt-2">
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
            
            <ChatInterface 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              fileName={fileToDisplay.name}
              transcriptionContext={getTranscription()}
              isLoading={isLoadingChat}
              isLimitExceeded={limitExceeded}
              disableAutoScroll={isTabSwitched}
            />
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default FileDetails;

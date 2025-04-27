import React, { useState, useEffect } from 'react';
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
import { AlertCircle, ExternalLink } from "lucide-react";
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
  
  // Fetch chat history when selecting a file or when tab is changed to chat
  useEffect(() => {
    if (selectedFile && (activeTab === "chat" || showChat)) {
      fetchChatHistory();
    }
  }, [selectedFile?.id, activeTab, showChat]);

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
    if (!selectedFile || !selectedFile.transcription) return '';
    
    // Если у нас есть транскрипция из API, преобразуем ее в нужный формат
    if (typeof selectedFile.transcription === 'object') {
      try {
        // Формат вида: "[timestamp] текст"
        if (selectedFile.transcription.segments) {
          return selectedFile.transcription.segments
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
        return JSON.stringify(selectedFile.transcription, null, 2);
      } catch (e) {
        console.error('Error parsing transcription:', e);
        return 'Ошибка при обработке транскрипции';
      }
    }
    
    // Если транскрипция уже строка, возвращаем ее
    return selectedFile.transcription.toString();
  };
  
  // Send selection to GPT chat
  const handleSendToGPT = (text: string) => {
    handleSendMessage(`Анализ текста: ${text.slice(0, 100)}...`);
    setActiveTab("chat");
  };

  if (!selectedFile) {
    return (
      <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex items-center justify-center h-full text-gray-500 p-10">
        Выберите файл для прослушивания
      </div>
    );
  }

  return (
    <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col">
      <FileHeader 
        file={selectedFile}
        onOpenAssistant={() => {
          onOpenAssistant();
          setActiveTab("chat");
        }}
        onRemoveNoise={onRemoveNoise}
        onRemoveMelody={onRemoveMelody}
        onRemoveVocals={onRemoveVocals}
      />
      
      <Tabs value={showChat ? "chat" : activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="audio">Аудио</TabsTrigger>
          <TabsTrigger value="transcription">Расшифровка</TabsTrigger>
          <TabsTrigger value="chat">GPT-ассистент</TabsTrigger>
        </TabsList>
        
        {activeTab === "audio" && (
          <div className="flex-1 flex">
            <AudioPlayer 
              file={selectedFile}
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
              fileId={selectedFile.id}
              transcription={selectedFile.transcription}
              transcriptionText={selectedFile.transcription_text}
              transcriptionVtt={selectedFile.transcription_vtt}
              transcriptionSrt={selectedFile.transcription_srt}
              onSendToGPT={handleSendToGPT}
            />
          </div>
        )}
        
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col">
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
              fileName={selectedFile.name}
              transcriptionContext={getTranscription()}
              isLoading={isLoadingChat}
              isLimitExceeded={limitExceeded}
            />
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default FileDetails;

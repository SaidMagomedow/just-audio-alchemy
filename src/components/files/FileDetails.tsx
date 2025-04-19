import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribedFile } from './FileList';
import { Message } from './ChatInterface';
import FileHeader from './FileHeader';
import AudioPlayer from './AudioPlayer';
import ChatInterface from './ChatInterface';
import Transcription from './Transcription';

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
    onSendMessage(`Анализ текста: ${text.slice(0, 100)}...`);
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
        
        <TabsContent value="audio" className="flex-1 flex">
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
        </TabsContent>
        
        <TabsContent value="transcription" className="flex-1 overflow-y-auto">
          <Transcription 
            fileId={selectedFile.id}
            transcription={getTranscription()}
            onSendToGPT={handleSendToGPT}
          />
        </TabsContent>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
          <ChatInterface 
            messages={messages}
            onSendMessage={onSendMessage}
            fileName={selectedFile.name}
            transcriptionContext={getTranscription()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileDetails;

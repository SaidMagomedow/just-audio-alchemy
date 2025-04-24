
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from 'lucide-react';
import { toast } from "sonner";
import { convertToWebVTT, convertToRST, convertToJSON } from '@/utils/transcriptionFormatters';
import TranscriptionActions from './transcription/TranscriptionActions';
import TranscriptionContent from './transcription/TranscriptionContent';

interface TranscriptionProps {
  fileId: string;
  transcription: string;
  onSendToGPT: (text: string) => void;
}

const Transcription: React.FC<TranscriptionProps> = ({ 
  fileId, 
  transcription, 
  onSendToGPT 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);
  const [activeTab, setActiveTab] = useState("text");
  
  const processedTranscription = transcription || 
    `[00:15] Здравствуйте, сегодня мы поговорим о важности правильной обработки аудио.
[00:32] Первое, на что стоит обратить внимание - это качество записи.
[01:05] Для хорошей расшифровки важно минимизировать фоновый шум.
[01:48] Использование специализированных инструментов может значительно повысить качество.
[02:30] В заключение, помните о правильном формате сохранения аудиофайлов.`;

  const handleSave = () => {
    toast.success("Изменения сохранены");
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedText(transcription);
    setIsEditing(false);
  };
  
  const handleCopy = () => {
    let textToCopy = processedTranscription;
    
    switch (activeTab) {
      case "webvtt":
        textToCopy = convertToWebVTT(processedTranscription);
        break;
      case "rst":
        textToCopy = convertToRST(processedTranscription);
        break;
      case "json":
        textToCopy = convertToJSON(processedTranscription);
        break;
    }
    
    navigator.clipboard.writeText(textToCopy);
    toast.success("Текст скопирован в буфер обмена");
  };
  
  const handleDownload = () => {
    let content = processedTranscription;
    let extension = "txt";
    
    switch (activeTab) {
      case "webvtt":
        content = convertToWebVTT(processedTranscription);
        extension = "vtt";
        break;
      case "rst":
        content = convertToRST(processedTranscription);
        extension = "rst";
        break;
      case "json":
        content = convertToJSON(processedTranscription);
        extension = "json";
        break;
    }
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${fileId}.${extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Файл скачан");
  };

  return (
    <div className="w-full p-6">
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Расшифровка</h3>
          
          <div className="flex gap-2">
            <TranscriptionActions 
              isEditing={isEditing}
              onSave={handleSave}
              onCancel={handleCancel}
              onEdit={() => setIsEditing(true)}
              onCopy={handleCopy}
              onDownload={handleDownload}
            />
          </div>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger value="webvtt">WebVTT</TabsTrigger>
            <TabsTrigger value="rst">RST</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <div className="min-h-[300px] border rounded-md p-4 bg-white">
            <TranscriptionContent 
              activeTab={activeTab}
              isEditing={isEditing}
              editedText={editedText}
              processedTranscription={processedTranscription}
              onEditChange={setEditedText}
            />
          </div>
        </Tabs>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={() => onSendToGPT(processedTranscription)}
          variant="default"
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Отправить в GPT</span>
        </Button>
      </div>
    </div>
  );
};

export default Transcription;

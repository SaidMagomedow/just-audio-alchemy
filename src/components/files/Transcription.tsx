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
  transcription: string | any; // Allow any type for transcription
  transcriptionText?: string;
  transcriptionVtt?: string;
  transcriptionSrt?: string;
  onSendToGPT: (text: string) => void;
}

const Transcription: React.FC<TranscriptionProps> = ({ 
  fileId, 
  transcription, 
  transcriptionText,
  transcriptionVtt,
  transcriptionSrt,
  onSendToGPT 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
  const [activeTab, setActiveTab] = useState("text");
  const [originalJson, setOriginalJson] = useState<any>(null);
  
  // Use the backend-provided transcription text if available, otherwise use the converted/processed one
  const processedTranscription = transcriptionText || (typeof transcription === 'string' ? transcription : '') || 
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
    setEditedText(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
    setIsEditing(false);
  };
  
  const handleCopy = () => {
    let textToCopy;
    
    switch (activeTab) {
      case "webvtt":
        textToCopy = transcriptionVtt || convertToWebVTT(processedTranscription);
        break;
      case "srt":
        textToCopy = transcriptionSrt || convertToRST(processedTranscription);
        break;
      case "json":
        // If we have the original transcription as an object, stringify it
        if (originalJson) {
          textToCopy = JSON.stringify(originalJson, null, 2);
        } else {
          textToCopy = convertToJSON(processedTranscription);
        }
        break;
      default:
        textToCopy = processedTranscription;
    }
    
    navigator.clipboard.writeText(textToCopy);
    toast.success("Текст скопирован в буфер обмена");
  };
  
  const handleDownload = () => {
    let content;
    let extension;
    
    switch (activeTab) {
      case "webvtt":
        content = transcriptionVtt || convertToWebVTT(processedTranscription);
        extension = "vtt";
        break;
      case "srt":
        content = transcriptionSrt || convertToRST(processedTranscription);
        extension = "srt";
        break;
      case "json":
        // If we have the original transcription as an object, stringify it
        if (originalJson) {
          content = JSON.stringify(originalJson, null, 2);
        } else {
          content = convertToJSON(processedTranscription);
        }
        extension = "json";
        break;
      default:
        content = processedTranscription;
        extension = "txt";
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

  // Function to get content for the current tab
  const getTranscriptionContent = () => {
    if (activeTab === 'text') {
      return processedTranscription;
    } else if (activeTab === 'webvtt') {
      return transcriptionVtt || convertToWebVTT(processedTranscription);
    } else if (activeTab === 'srt') {
      return transcriptionSrt || convertToRST(processedTranscription);
    } else if (activeTab === 'json') {
      // For JSON tab, return the original transcription object pretty-printed
      if (originalJson) {
        return JSON.stringify(originalJson, null, 2);
      } else {
        return convertToJSON(processedTranscription);
      }
    }
    return processedTranscription;
  };

  // Store the original transcription for re-use
  React.useEffect(() => {
    try {
      // If transcription is a string that looks like JSON, parse it
      if (typeof transcription === 'string' && 
          (transcription.trim().startsWith('{') || transcription.trim().startsWith('['))) {
        setOriginalJson(JSON.parse(transcription));
      } else if (typeof transcription === 'object' && transcription !== null) {
        setOriginalJson(transcription);
      }
    } catch (e) {
      console.error('Failed to parse transcription as JSON:', e);
      setOriginalJson(null);
    }
  }, [transcription]);

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Верхняя навигация с табами */}
      <div className="bg-gray-50 border-b mb-8 rounded-t-lg w-full max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger value="webvtt">WebVTT</TabsTrigger>
            <TabsTrigger value="srt">SRT</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Основной контент */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
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

          <div className="p-6 min-h-[250px]">
            <TranscriptionContent 
              activeTab={activeTab}
              isEditing={isEditing}
              editedText={editedText}
              processedTranscription={getTranscriptionContent()}
              onEditChange={setEditedText}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
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
    </div>
  );
};

export default Transcription;

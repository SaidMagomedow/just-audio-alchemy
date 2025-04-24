import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, MessageSquare, Pencil, Save, X } from 'lucide-react';
import { toast } from "sonner";

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

  const getWebVTT = (text: string) => {
    const lines = text.split('\n');
    return `WEBVTT

${lines.map((line, index) => {
  const match = line.match(/\[(\d{2}:\d{2})\]/);
  if (match) {
    const timestamp = match[1];
    const text = line.replace(/\[\d{2}:\d{2}\]\s*/, '');
    return `${index + 1}
${timestamp}.000 --> ${index < lines.length - 1 ? lines[index + 1].match(/\[(\d{2}:\d{2})\]/)?.[1] : '03:00'}.000
${text}

`;
  }
  return '';
}).join('')}`;
  };

  const getRST = (text: string) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const match = line.match(/\[(\d{2}:\d{2})\]\s*(.*)/);
      if (match) {
        return `.. _${match[1].replace(':', '_')}:

${match[2]}
--------------------

`;
      }
      return '';
    }).join('');
  };

  const getJSON = (text: string) => {
    const lines = text.split('\n');
    const segments = lines.map(line => {
      const match = line.match(/\[(\d{2}:\d{2})\]\s*(.*)/);
      if (match) {
        return {
          timestamp: match[1],
          text: match[2]
        };
      }
      return null;
    }).filter(Boolean);

    return JSON.stringify({ segments }, null, 2);
  };

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
        textToCopy = getWebVTT(processedTranscription);
        break;
      case "rst":
        textToCopy = getRST(processedTranscription);
        break;
      case "json":
        textToCopy = getJSON(processedTranscription);
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
        content = getWebVTT(processedTranscription);
        extension = "vtt";
        break;
      case "rst":
        content = getRST(processedTranscription);
        extension = "rst";
        break;
      case "json":
        content = getJSON(processedTranscription);
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
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave}
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Сохранить</span>
                </Button>
                
                <Button 
                  onClick={handleCancel}
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  <span>Отмена</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Редактировать</span>
                </Button>
                
                <Button 
                  onClick={handleCopy}
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>Копировать</span>
                </Button>
                
                <Button 
                  onClick={handleDownload}
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Скачать</span>
                </Button>
              </>
            )}
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
            <TabsContent value="text" className="w-full">
              {isEditing ? (
                <Textarea 
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[250px] font-mono text-sm"
                />
              ) : (
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {processedTranscription}
                </div>
              )}
            </TabsContent>

            <TabsContent value="webvtt" className="w-full">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {getWebVTT(processedTranscription)}
              </div>
            </TabsContent>

            <TabsContent value="rst" className="w-full">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {getRST(processedTranscription)}
              </div>
            </TabsContent>

            <TabsContent value="json" className="w-full">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {getJSON(processedTranscription)}
              </div>
            </TabsContent>
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

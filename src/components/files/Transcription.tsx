
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
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
  
  // For demonstration, let's create some dummy transcription with timestamps
  const processedTranscription = transcription || 
    `[00:15] Здравствуйте, сегодня мы поговорим о важности правильной обработки аудио.
[00:32] Первое, на что стоит обратить внимание - это качество записи.
[01:05] Для хорошей расшифровки важно минимизировать фоновый шум.
[01:48] Использование специализированных инструментов может значительно повысить качество.
[02:30] В заключение, помните о правильном формате сохранения аудиофайлов.`;

  // Save edited text
  const handleSave = () => {
    toast.success("Изменения сохранены");
    setIsEditing(false);
    // Here you would typically send the changes to the server
  };
  
  // Cancel editing
  const handleCancel = () => {
    setEditedText(transcription); // Revert changes
    setIsEditing(false);
  };
  
  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(processedTranscription);
    toast.success("Текст скопирован в буфер обмена");
  };
  
  // Download as text file
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([processedTranscription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${fileId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Файл скачан");
  };
  
  // Make timestamps clickable
  const renderClickableTimestamps = (text: string) => {
    const regex = /\[(\d{2}:\d{2})\]/g;
    const parts = text.split(regex);
    
    if (parts.length <= 1) return text;
    
    const result: JSX.Element[] = [];
    let i = 0;
    
    while (i < parts.length) {
      if (i % 2 === 0) {
        // Regular text
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      } else {
        // Timestamp - make it clickable
        result.push(
          <button 
            key={`time-${i}`}
            className="text-primary hover:underline font-mono"
            onClick={() => {
              // Here you would seek to this position in the audio
              toast.info(`Переход к позиции ${parts[i]}`);
            }}
          >
            [{parts[i]}]
          </button>
        );
      }
      i++;
    }
    
    return <>{result}</>;
  };
  
  // Handle sending selection to GPT
  const handleSendToGPT = (e: React.MouseEvent<HTMLButtonElement>, text: string = '') => {
    let selectedText = text;
    
    if (!text) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        selectedText = selection.toString();
      } else {
        selectedText = processedTranscription;
      }
    }
    
    if (selectedText) {
      onSendToGPT(selectedText);
    }
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
        
        {/* Transcription content */}
        {isEditing ? (
          <Textarea 
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        ) : (
          <div className="bg-white border rounded-md p-4 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {renderClickableTimestamps(processedTranscription)}
            
            {/* Floating action button for selected text */}
            <div className="fixed bottom-6 right-6 shadow-lg rounded-full z-10 hidden selection:block">
              <Button 
                onClick={handleSendToGPT}
                className="rounded-full h-12 w-12 flex items-center justify-center"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div className="flex justify-end">
        <Button 
          onClick={(e) => handleSendToGPT(e)}
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

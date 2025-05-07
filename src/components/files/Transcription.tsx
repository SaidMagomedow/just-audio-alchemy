import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Lock, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { convertToWebVTT, convertToRST, convertToJSON } from '@/utils/transcriptionFormatters';
import TranscriptionActions from './transcription/TranscriptionActions';
import TranscriptionContent from './transcription/TranscriptionContent';
import api from '@/lib/api';
import { UserProductPlan } from '@/types/userPlan';
import UpgradePlanModal from '../modals/UpgradePlanModal';

interface TranscriptionProps {
  fileId: string;
  transcription: string | any; // Allow any type for transcription
  transcriptionText?: string;
  transcriptionVtt?: string;
  transcriptionSrt?: string;
  transcriptionStatus?: string; // Добавляем статус расшифровки
  onSendToGPT: (text: string) => void;
  userPlan?: UserProductPlan; // Добавляем информацию о подписке пользователя
  onTranscriptionStatusChange?: (status: string) => void; // Добавляем обработчик изменения статуса
}

const Transcription: React.FC<TranscriptionProps> = ({ 
  fileId, 
  transcription: initialTranscription, 
  transcriptionText: initialTranscriptionText,
  transcriptionVtt: initialTranscriptionVtt,
  transcriptionSrt: initialTranscriptionSrt,
  transcriptionStatus: initialTranscriptionStatus = 'not started', // По умолчанию статус "не начато"
  onSendToGPT,
  userPlan,
  onTranscriptionStatusChange
}) => {
  // Local state for all transcription formats
  const [transcription, setTranscription] = useState<any>(initialTranscription);
  const [transcriptionText, setTranscriptionText] = useState(initialTranscriptionText);
  const [transcriptionVtt, setTranscriptionVtt] = useState(initialTranscriptionVtt);
  const [transcriptionSrt, setTranscriptionSrt] = useState(initialTranscriptionSrt);
  const [transcriptionStatus, setTranscriptionStatus] = useState(initialTranscriptionStatus);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [activeTab, setActiveTab] = useState("text");
  const [originalJson, setOriginalJson] = useState<any>(null);
  
  // Добавляем состояние для модального окна
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [featureToUpgrade, setFeatureToUpgrade] = useState('');
  
  // Обновляем состояние для отслеживания процесса транскрибирования
  // в соответствии с переданным статусом из props
  const [isTranscribing, setIsTranscribing] = useState(transcriptionStatus === 'processing');
  const [transcriptionFailed, setTranscriptionFailed] = useState(transcriptionStatus === 'failed');
  
  // Проверка поддержки форматов в подписке пользователя
  const vttSupported = userPlan?.vtt_file_ext_support ? true : false;
  const srtSupported = userPlan?.srt_file_ext_support ? true : false;
  // Проверка доступности GPT
  const canUseGpt = !!userPlan?.is_can_use_gpt;
  
  // Use the backend-provided transcription text if available, otherwise use the converted/processed one
  const processedTranscription = transcriptionText || (typeof transcription === 'string' ? transcription : '') || 
    `Аудиофайл не имеет расшифровки.`;

  const handleSave = async () => {
    try {
      let transcriptionType = activeTab;
      let data = editedText;
      
      // Convert activeTab to API expected format
      if (activeTab === 'webvtt') {
        transcriptionType = 'vtt';
      }
      
      // Send data to API
      await api.post(`/user-files/${fileId}/transcription`, {
        transcription_type: transcriptionType,
        data: data
      });
      
      // Update local state to keep the edited content
      if (activeTab === 'text') {
        setTranscriptionText(editedText);
      } else if (activeTab === 'webvtt') {
        setTranscriptionVtt(editedText);
      } else if (activeTab === 'srt') {
        setTranscriptionSrt(editedText);
      } else if (activeTab === 'json') {
        try {
          // If it's valid JSON, update the originalJson state
          const jsonData = JSON.parse(editedText);
          setOriginalJson(jsonData);
          setTranscription(jsonData);
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
      
      toast.success("Изменения сохранены");
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving transcription:', error);
      toast.error("Ошибка при сохранении изменений");
    }
  };
  
  const handleCancel = () => {
    // Reset edited text based on current tab
    if (activeTab === 'text') {
      setEditedText(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
    } else if (activeTab === 'webvtt') {
      setEditedText(transcriptionVtt || convertToWebVTT(processedTranscription));
    } else if (activeTab === 'srt') {
      setEditedText(transcriptionSrt || convertToRST(processedTranscription));
    } else if (activeTab === 'json') {
      if (originalJson) {
        setEditedText(JSON.stringify(originalJson, null, 2));
      } else {
        setEditedText(convertToJSON(processedTranscription));
      }
    }
    
    setIsEditing(false);
  };
  
  const handleCopy = () => {
    // Проверка ограничений по подписке
    if (activeTab === "webvtt" && !vttSupported) {
      setFeatureToUpgrade('WebVTT');
      setShowUpgradeModal(true);
      return;
    }
    
    if (activeTab === "srt" && !srtSupported) {
      setFeatureToUpgrade('SRT');
      setShowUpgradeModal(true);
      return;
    }
    
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
    // Проверка ограничений по подписке
    if (activeTab === "webvtt" && !vttSupported) {
      setFeatureToUpgrade('WebVTT');
      setShowUpgradeModal(true);
      return;
    }
    
    if (activeTab === "srt" && !srtSupported) {
      setFeatureToUpgrade('SRT');
      setShowUpgradeModal(true);
      return;
    }
    
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
      return transcriptionText || (typeof transcription === 'string' ? transcription : '');
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
    return transcriptionText || (typeof transcription === 'string' ? transcription : '');
  };

  // Store the original transcription for re-use
  useEffect(() => {
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

  // When tab changes and in edit mode, update edited text to match current tab
  useEffect(() => {
    if (isEditing) {
      if (activeTab === 'text') {
        setEditedText(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
      } else if (activeTab === 'webvtt') {
        setEditedText(transcriptionVtt || convertToWebVTT(processedTranscription));
      } else if (activeTab === 'srt') {
        setEditedText(transcriptionSrt || convertToRST(processedTranscription));
      } else if (activeTab === 'json') {
        if (originalJson) {
          setEditedText(JSON.stringify(originalJson, null, 2));
        } else {
          setEditedText(convertToJSON(processedTranscription));
        }
      }
    }
  }, [activeTab, isEditing]);

  // Init edited text when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (activeTab === 'text') {
        setEditedText(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
      } else if (activeTab === 'webvtt') {
        setEditedText(transcriptionVtt || convertToWebVTT(processedTranscription));
      } else if (activeTab === 'srt') {
        setEditedText(transcriptionSrt || convertToRST(processedTranscription));
      } else if (activeTab === 'json') {
        if (originalJson) {
          setEditedText(JSON.stringify(originalJson, null, 2));
        } else {
          setEditedText(convertToJSON(processedTranscription));
        }
      }
    }
  }, [isEditing]);

  // Handle tab change - set edited text based on current format
  const handleTabChange = (value: string) => {
    // Проверяем, доступен ли выбранный формат
    if (value === "webvtt" && !vttSupported) {
      setFeatureToUpgrade('WebVTT');
      setShowUpgradeModal(true);
      return;
    }
    
    if (value === "srt" && !srtSupported) {
      setFeatureToUpgrade('SRT');
      setShowUpgradeModal(true);
      return;
    }
    
    setActiveTab(value);
    
    // If editing, prep the edit text for the new tab format
    if (isEditing) {
      if (value === 'text') {
        setEditedText(transcriptionText || (typeof transcription === 'string' ? transcription : ''));
      } else if (value === 'webvtt') {
        setEditedText(transcriptionVtt || convertToWebVTT(processedTranscription));
      } else if (value === 'srt') {
        setEditedText(transcriptionSrt || convertToRST(processedTranscription));
      } else if (value === 'json') {
        if (originalJson) {
          setEditedText(JSON.stringify(originalJson, null, 2));
        } else {
          setEditedText(convertToJSON(processedTranscription));
        }
      }
    }
  };

  // Обработчик закрытия модального окна
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  // Update local state when props change
  useEffect(() => {
    setTranscription(initialTranscription);
    setTranscriptionText(initialTranscriptionText);
    setTranscriptionVtt(initialTranscriptionVtt);
    setTranscriptionSrt(initialTranscriptionSrt);
    setTranscriptionStatus(initialTranscriptionStatus);
  }, [initialTranscription, initialTranscriptionText, initialTranscriptionVtt, initialTranscriptionSrt, initialTranscriptionStatus]);

  // Синхронизируем состояния с transcriptionStatus
  useEffect(() => {
    setIsTranscribing(transcriptionStatus === 'processing');
    setTranscriptionFailed(transcriptionStatus === 'failed');
  }, [transcriptionStatus]);

  // Обработчик отправки текста в GPT
  const handleSendToGPT = () => {
    // Проверяем доступность GPT
    if (!canUseGpt) {
      setFeatureToUpgrade('GPT-ассистент');
      setShowUpgradeModal(true);
      return;
    }
    
    onSendToGPT(processedTranscription);
  };

  // Функция для запуска транскрибирования
  const handleStartTranscription = async () => {
    if (!fileId) return;
    
    try {
      // Устанавливаем состояние в processing
      handleTranscriptionStatusChange('processing');
      setIsTranscribing(true);
      setTranscriptionFailed(false);
      
      // Вызываем API для запуска транскрибирования
      await api.post('/audio/convert/file/transcription', {
        file_ids: [parseInt(fileId)]
      });
      
      toast.success("Расшифровка аудио запущена. Это может занять некоторое время.");
      
      // Оставляем индикатор загрузки активным, так как процесс идет на сервере
      // Реальное обновление произойдет при следующем получении данных о файле
    } catch (error) {
      console.error('Error starting transcription:', error);
      toast.error("Ошибка при запуске расшифровки");
      // В случае ошибки устанавливаем статус в failed
      handleTranscriptionStatusChange('failed');
      setIsTranscribing(false);
      setTranscriptionFailed(true);
    }
  };

  // Обработчик изменения статуса
  const handleTranscriptionStatusChange = (status: string) => {
    if (onTranscriptionStatusChange) {
      onTranscriptionStatusChange(status);
    }
    setTranscriptionStatus(status);
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Верхняя навигация с табами */}
      <div className="bg-gray-50 border-b mb-8 rounded-t-lg w-full max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger 
              value="webvtt" 
              className="flex items-center gap-1"
            >
              WebVTT
              {!vttSupported && <Lock className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger 
              value="srt" 
              className="flex items-center gap-1"
            >
              SRT
              {!srtSupported && <Lock className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Основной контент */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">
              Расшифровка
              {transcriptionStatus === 'processing' && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  В процессе
                </span>
              )}
              {transcriptionStatus === 'completed' && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full inline-flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Готово
                </span>
              )}
              {transcriptionStatus === 'failed' && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full inline-flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Ошибка
                </span>
              )}
            </h3>
            
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
            {/* Проверяем статус расшифровки */}
            {transcriptionStatus === 'not started' && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <p className="text-gray-500 text-center mb-4">Расшифровка не запущена</p>
                <Button 
                  onClick={handleStartTranscription}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Запустить расшифровку</span>
                </Button>
              </div>
            )}
            
            {transcriptionStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-gray-600">Расшифровка аудио в процессе...</p>
                <p className="text-gray-500 text-sm">Это может занять некоторое время в зависимости от длины аудио.</p>
              </div>
            )}
            
            {transcriptionStatus === 'failed' && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-gray-600 text-center">Расшифровка прошла с ошибкой, попробуйте немного позднее</p>
                <Button 
                  onClick={handleStartTranscription}
                  variant="default"
                  className="flex items-center gap-2 mt-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Повторить расшифровку</span>
                </Button>
              </div>
            )}
            
            {transcriptionStatus === 'completed' && (
              <TranscriptionContent 
                activeTab={activeTab}
                isEditing={isEditing}
                editedText={editedText}
                processedTranscription={isEditing ? editedText : getTranscriptionContent()}
                onEditChange={setEditedText}
              />
            )}
            
            {/* Если у нас нет явного статуса, но есть данные расшифровки */}
            {transcriptionStatus !== 'not started' && 
             transcriptionStatus !== 'processing' && 
             transcriptionStatus !== 'failed' && 
             transcriptionStatus !== 'completed' && 
             processedTranscription && 
             processedTranscription !== 'Аудиофайл не имеет расшифровки.' && (
              <TranscriptionContent 
                activeTab={activeTab}
                isEditing={isEditing}
                editedText={editedText}
                processedTranscription={isEditing ? editedText : getTranscriptionContent()}
                onEditChange={setEditedText}
              />
            )}
            
            {/* Если у нас нет явного статуса и нет данных расшифровки */}
            {transcriptionStatus !== 'not started' && 
             transcriptionStatus !== 'processing' && 
             transcriptionStatus !== 'failed' && 
             transcriptionStatus !== 'completed' && 
             (!processedTranscription || processedTranscription === 'Аудиофайл не имеет расшифровки.') && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <p className="text-gray-500 text-center mb-4">Расшифровка не найдена</p>
                <Button 
                  onClick={handleStartTranscription}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Запустить расшифровку</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleSendToGPT}
            variant="default"
            className="flex items-center gap-2"
            disabled={transcriptionStatus !== 'completed' || 
                      (!processedTranscription || processedTranscription === 'Аудиофайл не имеет расшифровки.')}
          >
            {!canUseGpt && <Lock className="h-4 w-4 mr-1" />}
            <MessageSquare className="h-4 w-4" />
            <span>Отправить в GPT</span>
          </Button>
        </div>
      </div>

      {/* Модальное окно для улучшения подписки */}
      <UpgradePlanModal 
        isOpen={showUpgradeModal} 
        onClose={handleCloseUpgradeModal} 
        feature={featureToUpgrade}
      />
    </div>
  );
};

export default Transcription;

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  Copy, 
  Lock, 
  Zap, 
  Brain, 
  Award 
} from 'lucide-react';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UpgradePlanModal from '../modals/UpgradePlanModal';
import { UserProductPlan } from '@/types/userPlan';

// Тип для моделей GPT
export type GptModel = 'high-speed' | 'thinking' | 'pro';

// Message types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, model?: GptModel) => void;
  fileName: string;
  transcriptionContext?: string;
  isLoading?: boolean;
  isLimitExceeded?: boolean;
  disableAutoScroll?: boolean;
  userPlan?: UserProductPlan;
}

// Format time utility
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Key for localStorage
const SELECTED_MODEL_KEY = 'selectedGptModel';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage,
  fileName,
  transcriptionContext,
  isLoading = false,
  isLimitExceeded = false,
  disableAutoScroll = false,
  userPlan
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  // Инициализация с сохраненным значением из localStorage или 'high-speed' по умолчанию
  const [selectedModel, setSelectedModel] = useState<GptModel>(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
      return (savedModel as GptModel) || 'high-speed';
    }
    return 'high-speed';
  });
  
  // Модальное окно для улучшения подписки
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Проверка доступности выбора модели GPT
  const canSelectGptModel = !!userPlan?.is_can_select_gpt_model;

  // Сохранение выбранной модели в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_MODEL_KEY, selectedModel);
    }
  }, [selectedModel]);

  // Получение иконки для текущей модели
  const getModelIcon = () => {
    switch (selectedModel) {
      case 'high-speed':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'thinking':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'pro':
        return <Award className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Scroll to the latest message only when sending messages, not on tab switch
  useEffect(() => {
    // Скролл только при отправке новых сообщений или когда нет флага disableAutoScroll
    if (messagesEndRef.current && !disableAutoScroll && !isUserScrolling) {
      // Проверяем, было ли добавлено новое сообщение
      const isNewMessageAdded = messages.length > 0 && messages[messages.length - 1].timestamp >= new Date(Date.now() - 2000);
    }
  }, [messages, disableAutoScroll, isUserScrolling]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setIsProcessing(true);
    onSendMessage(newMessage, selectedModel);
    setNewMessage('');
    setIsUserScrolling(false); // Сбрасываем флаг пользовательского скролла при отправке нового сообщения
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 500);
  };
  
  // Обработчик выбора модели
  const handleModelChange = (value: string) => {
    if (!canSelectGptModel) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedModel(value as GptModel);
  };
  
  // Обработчик закрытия модального окна
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
  };
  
  // Обработчик скролла пользователем
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    
    // Если пользователь не в конце списка, считаем что он скроллит сам
    setIsUserScrolling(!isAtBottom);
  };
  
  // Copy message to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Сообщение скопировано");
  };

  return (
    <div className="relative flex flex-col h-full">
      
      {/* Messages area with overflow scroll */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Загрузка сообщений...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto pb-4">
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-[calc(100vh-300px)] text-gray-400">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Задайте вопрос, чтобы начать диалог</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-primary" />
                      </div>
                    )}
                    
                    <div 
                      className={`group max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-[#F1F0FB] text-black ml-auto' 
                          : 'bg-[#D3E4FD] text-black'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div className="bg-[#D3E4FD] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Генерация ответа...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Bottom fixed input area */}
      <div className="flex-shrink-0 border-t bg-white">
        {/* Context indicator for transcription */}
        {transcriptionContext && (
          <div className="px-4 py-2 bg-primary/5 border-b text-sm">
            <p className="text-gray-600">Анализируется расшифровка файла <span className="font-medium">{fileName}</span></p>
          </div>
        )}
        
        {/* Message input - fixed at bottom */}
        <div className="p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            {/* Селектор модели GPT */}
            <div className="min-w-[120px]">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">GPT-модель</span>
                <Select
                  value={selectedModel}
                  onValueChange={handleModelChange}
                  disabled={isLoading || isLimitExceeded}
                >
                  <SelectTrigger className="h-[60px] w-full bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="flex items-center gap-2">
                      {getModelIcon()}
                      <span className="text-sm font-medium">{selectedModel === 'high-speed' ? 'High-Speed' : 
                                selectedModel === 'thinking' ? 'Thinking' : 'Pro'}</span>
                      {!canSelectGptModel && <Lock className="h-3 w-3 ml-1" />}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-speed" className="flex items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>High-Speed</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="thinking" className="flex items-center">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <span>Thinking</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro" className="flex items-center">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span>Pro</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Textarea 
              ref={textareaRef}
              placeholder={isLimitExceeded ? "Лимит GPT запросов исчерпан" : "Напишите сообщение..."} 
              className="min-h-[60px] resize-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading || isLimitExceeded}
            />
            <Button 
              onClick={handleSend}
              disabled={!newMessage.trim() || isProcessing || isLoading || isLimitExceeded}
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Модальное окно для улучшения подписки */}
      <UpgradePlanModal 
        isOpen={showUpgradeModal} 
        onClose={handleCloseUpgradeModal} 
        feature="Выбор модели GPT"
      />
    </div>
  );
};

export default ChatInterface;

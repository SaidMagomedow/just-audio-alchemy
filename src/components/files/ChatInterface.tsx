import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { Send, Bot, User, RefreshCw, Copy } from 'lucide-react';
import { toast } from "sonner";

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
  onSendMessage: (message: string) => void;
  fileName: string;
  transcriptionContext?: string;
  isLoading?: boolean;
  isLimitExceeded?: boolean;
  disableAutoScroll?: boolean;
}

// Format time utility
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage,
  fileName,
  transcriptionContext,
  isLoading = false,
  isLimitExceeded = false,
  disableAutoScroll = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Scroll to the latest message only when sending messages, not on tab switch
  useEffect(() => {
    // Скролл только при отправке новых сообщений или когда нет флага disableAutoScroll
    if (messagesEndRef.current && !disableAutoScroll && !isUserScrolling) {
      // Проверяем, было ли добавлено новое сообщение
      const isNewMessageAdded = messages.length > 0 && messages[messages.length - 1].timestamp >= new Date(Date.now() - 2000);
      
      if (isNewMessageAdded) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, disableAutoScroll, isUserScrolling]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setIsProcessing(true);
    onSendMessage(newMessage);
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
    <div className="flex flex-col h-full relative">
      
      {/* Messages area - с адаптивным размером */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gray-50" 
        style={{ 
          height: transcriptionContext ? "calc(100% - 180px - 41px)" : "calc(100% - 180px)",
          minHeight: "250px"
        }}
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
          <div className="space-y-4 max-w-3xl mx-auto">
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Context indicator for transcription */}
      {transcriptionContext && (
        <div className="px-4 py-2 bg-primary/5 border-t border-b text-sm sticky bottom-[84px]">
          <p className="text-gray-600">Анализируется расшифровка файла <span className="font-medium">{fileName}</span></p>
        </div>
      )}
      
      {/* Message input */}
      <div className="p-4 border-t mt-auto sticky bottom-0 z-10 bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
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
  );
};

export default ChatInterface;

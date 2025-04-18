
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from "@/components/ui/button";
import { Send, Bot, User, RefreshCw, Copy } from 'lucide-react';
import { toast } from "sonner";

// Message types
export type MessageType = 'user' | 'server';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  fileName: string;
  transcriptionContext?: string;
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
  transcriptionContext
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setIsProcessing(true);
    onSendMessage(newMessage);
    setNewMessage('');
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      // Focus back on textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 500);
  };
  
  // Copy message to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Сообщение скопировано");
  };

  return (
    <div className="flex flex-col h-full">
      {/* File header with context indicator */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{fileName}</h3>
          {transcriptionContext && (
            <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              Контекст расшифровки учтен
            </div>
          )}
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ minHeight: "300px" }}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'server' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              
              <div 
                className={`group max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user' 
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
              
              {message.type === 'user' && (
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
      </div>
      
      {/* Context indicator for transcription */}
      {transcriptionContext && (
        <div className="px-4 py-2 bg-primary/5 border-t border-b text-sm">
          <p className="text-gray-600">Анализируется расшифровка файла <span className="font-medium">{fileName}</span></p>
        </div>
      )}
      
      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea 
            ref={textareaRef}
            placeholder="Напишите сообщение..." 
            className="min-h-[60px] resize-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || isProcessing}
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

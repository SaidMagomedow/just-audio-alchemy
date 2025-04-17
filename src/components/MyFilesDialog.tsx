
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, File, Bot, User } from 'lucide-react';

// Типы сообщений
type MessageType = 'user' | 'server';

interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

// Имитация данных о расшифрованных файлах
interface TranscribedFile {
  id: string;
  name: string;
  date: Date;
  duration: string;
}

const mockFiles: TranscribedFile[] = [
  { id: '1', name: 'Интервью с экспертом', date: new Date(2023, 3, 15), duration: '45:22' },
  { id: '2', name: 'Подкаст - Выпуск 12', date: new Date(2023, 4, 2), duration: '32:18' },
  { id: '3', name: 'Голосовая заметка', date: new Date(2023, 4, 10), duration: '5:46' },
];

// Имитация сообщений для чата
const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Привет! Я AI-ассистент just.audio.ai. Я могу помочь с анализом и редактированием вашей расшифровки. Что бы вы хотели сделать с этим файлом?',
    type: 'server',
    timestamp: new Date(2023, 4, 15, 10, 30)
  }
];

interface MyFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyFilesDialog({ open, onOpenChange }: MyFilesDialogProps) {
  const [selectedFile, setSelectedFile] = useState<TranscribedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Прокрутка к последнему сообщению
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileSelect = (file: TranscribedFile) => {
    setSelectedFile(file);
    // Сбрасываем сообщения для нового файла
    setMessages(initialMessages);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Имитация ответа от сервера
    setTimeout(() => {
      const serverResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Я обработал ваш запрос по файлу "${selectedFile?.name}". Могу предложить оптимизировать текст и улучшить его структуру. Что-нибудь еще?`,
        type: 'server',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, serverResponse]);
    }, 1000);
  };

  // Форматирование даты
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Форматирование времени
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-semibold">Мои файлы</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Список файлов */}
          <div className="w-1/3 border-r overflow-y-auto p-4">
            <h3 className="font-medium mb-4">Расшифрованные файлы</h3>
            <div className="space-y-2">
              {mockFiles.map(file => (
                <div 
                  key={file.id}
                  onClick={() => handleFileSelect(file)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${selectedFile?.id === file.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <File className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-1">
                      <span>{formatDate(file.date)}</span>
                      <span>•</span>
                      <span>{file.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Чат с расшифровкой */}
          <div className="w-2/3 flex flex-col">
            {selectedFile ? (
              <>
                {/* Заголовок с именем файла */}
                <div className="p-4 border-b">
                  <h3 className="font-medium">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedFile.date)} • {selectedFile.duration}
                  </p>
                </div>
                
                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="space-y-4">
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
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user' 
                              ? 'bg-[#F1F0FB] text-black ml-auto' 
                              : 'bg-[#D3E4FD] text-black'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        
                        {message.type === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Поле ввода сообщения */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Напишите сообщение..." 
                      className="min-h-[60px] resize-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="h-auto"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Выберите файл для просмотра расшифровки
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

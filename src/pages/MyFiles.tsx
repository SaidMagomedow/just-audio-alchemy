
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  File, 
  Bot, 
  User, 
  MessageCircle, 
  Volume2, 
  Music, 
  MicOff,
  Mic
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
  audioUrl: string; // URL к аудиофайлу
}

const mockFiles: TranscribedFile[] = [
  { 
    id: '1', 
    name: 'Интервью с экспертом', 
    date: new Date(2023, 3, 15), 
    duration: '45:22',
    audioUrl: 'https://cdn.freesound.org/previews/635/635096_5674468-lq.mp3'
  },
  { 
    id: '2', 
    name: 'Подкаст - Выпуск 12', 
    date: new Date(2023, 4, 2), 
    duration: '32:18',
    audioUrl: 'https://cdn.freesound.org/previews/558/558807_1049638-lq.mp3'
  },
  { 
    id: '3', 
    name: 'Голосовая заметка', 
    date: new Date(2023, 4, 10), 
    duration: '5:46',
    audioUrl: 'https://cdn.freesound.org/previews/626/626849_11861866-lq.mp3'
  },
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

const MyFiles = () => {
  const [selectedFile, setSelectedFile] = useState<TranscribedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Прокрутка к последнему сообщению
  React.useEffect(() => {
    if (messagesEndRef.current && showChat) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleFileSelect = (file: TranscribedFile) => {
    setSelectedFile(file);
    setShowChat(false); // По умолчанию показываем аудиоплеер, а не чат
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

  // Обработчики для действий с файлом
  const handleOpenAssistant = () => {
    setShowChat(true);
    toast.success(`Открыт CPT ассистент для файла "${selectedFile?.name}"`);
  };

  const handleRemoveNoise = () => {
    toast.success(`Запущено удаление шума из "${selectedFile?.name}"`);
  };

  const handleRemoveMelody = () => {
    toast.success(`Запущено удаление мелодии из "${selectedFile?.name}"`);
  };

  const handleRemoveVocals = () => {
    toast.success(`Запущено удаление вокала из "${selectedFile?.name}"`);
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20 container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Мои файлы</h1>

        <div className="flex flex-col md:flex-row gap-6 mb-8 min-h-[calc(100vh-250px)]">
          {/* Список файлов */}
          <div className="w-full md:w-1/3 border rounded-lg shadow-sm overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-medium">Расшифрованные файлы</h3>
            </div>
            <div className="p-2">
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
          
          {/* Правая панель: аудиоплеер или чат */}
          <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col">
            {selectedFile ? (
              <>
                {/* Заголовок с именем файла и опциями */}
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{selectedFile.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedFile.date)} • {selectedFile.duration}
                    </p>
                  </div>
                  
                  {/* Выпадающее меню с опциями для файла */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Опции
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleOpenAssistant} className="cursor-pointer flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <span>CPT ассистент</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveNoise} className="cursor-pointer flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Удалить шум</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveMelody} className="cursor-pointer flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        <span>Удалить мелодию</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveVocals} className="cursor-pointer flex items-center gap-2">
                        <MicOff className="h-4 w-4" />
                        <span>Удалить вокал</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {showChat ? (
                  <>
                    {/* Сообщения */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ minHeight: "300px" }}>
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
                  /* Аудиоплеер */
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-3xl bg-gray-50 rounded-lg p-6 flex flex-col items-center">
                      <h3 className="text-lg font-medium mb-4">Прослушать исходный файл</h3>
                      
                      <audio 
                        ref={audioRef}
                        controls 
                        className="w-full mb-6" 
                        src={selectedFile.audioUrl}
                      >
                        Ваш браузер не поддерживает аудио элемент.
                      </audio>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <Button 
                          onClick={handleOpenAssistant}
                          variant="outline" 
                          className="flex items-center gap-2 h-auto py-3"
                        >
                          <Mic className="h-5 w-5" />
                          <span>CPT ассистент</span>
                        </Button>
                        
                        <Button 
                          onClick={handleRemoveNoise}
                          variant="outline" 
                          className="flex items-center gap-2 h-auto py-3"
                        >
                          <Volume2 className="h-5 w-5" />
                          <span>Удалить шум</span>
                        </Button>
                        
                        <Button 
                          onClick={handleRemoveMelody}
                          variant="outline" 
                          className="flex items-center gap-2 h-auto py-3"
                        >
                          <Music className="h-5 w-5" />
                          <span>Удалить мелодию</span>
                        </Button>
                        
                        <Button 
                          onClick={handleRemoveVocals}
                          variant="outline" 
                          className="flex items-center gap-2 h-auto py-3"
                        >
                          <MicOff className="h-5 w-5" />
                          <span>Удалить вокал</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-10">
                Выберите файл для прослушивания
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyFiles;

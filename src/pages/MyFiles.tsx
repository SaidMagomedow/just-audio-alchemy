
import React, { useState } from 'react';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileList, { TranscribedFile } from '@/components/files/FileList';
import FileDetails from '@/components/files/FileDetails';
import { Message } from '@/components/files/ChatInterface';
import { mockFiles, initialMessages } from '@/data/mockFiles';

const MyFiles: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<TranscribedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showChat, setShowChat] = useState(false);

  const handleFileSelect = (file: TranscribedFile) => {
    setSelectedFile(file);
    setShowChat(false); // Default to audio player, not chat
    // Reset messages for new file
    setMessages(initialMessages);
  };

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate server response
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

  // Handlers for file actions
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20 container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Мои файлы</h1>

        <div className="flex flex-col md:flex-row gap-6 mb-8 min-h-[calc(100vh-250px)]">
          {/* List of files */}
          <FileList 
            files={mockFiles}
            selectedFileId={selectedFile?.id || null}
            onFileSelect={handleFileSelect}
          />
          
          {/* File details panel (audio player or chat) */}
          <FileDetails 
            selectedFile={selectedFile}
            showChat={showChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            onOpenAssistant={handleOpenAssistant}
            onRemoveNoise={handleRemoveNoise}
            onRemoveMelody={handleRemoveMelody}
            onRemoveVocals={handleRemoveVocals}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyFiles;

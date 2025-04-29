import { TranscribedFile } from "../components/files/FileList";
import { Message } from "../components/files/ChatInterface";

// Mock transcribed files data
export const mockFiles: TranscribedFile[] = [
  { 
    id: '1', 
    name: 'Интервью с экспертом', 
    date: new Date(2023, 3, 15), 
    duration: '45:22',
    audioUrl: 'https://cdn.freesound.org/previews/635/635096_5674468-lq.mp3',
    status: 'completed'
  },
  { 
    id: '2', 
    name: 'Подкаст - Выпуск 12', 
    date: new Date(2023, 4, 2), 
    duration: '32:18',
    audioUrl: 'https://cdn.freesound.org/previews/558/558807_1049638-lq.mp3',
    status: 'completed'
  },
  { 
    id: '3', 
    name: 'Голосовая заметка', 
    date: new Date(2023, 4, 10), 
    duration: '5:46',
    audioUrl: 'https://cdn.freesound.org/previews/626/626849_11861866-lq.mp3',
    status: 'completed'
  },
  { 
    id: '4', 
    name: 'Рабочая встреча', 
    date: new Date(2023, 4, 15), 
    duration: '28:10',
    audioUrl: 'https://cdn.freesound.org/previews/635/635096_5674468-lq.mp3',
    status: 'processing'
  },
  { 
    id: '5', 
    name: 'Учебная лекция', 
    date: new Date(2023, 4, 18), 
    duration: '1:15:33',
    audioUrl: 'https://cdn.freesound.org/previews/558/558807_1049638-lq.mp3',
    status: 'error'
  },
];

// Initial chat messages
export const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Привет! Я AI-ассистент Just.Audio.AI. Я могу помочь с анализом и редактированием вашей расшифровки. Что бы вы хотели сделать с этим файлом?',
    role: 'assistant',
    timestamp: new Date(2023, 4, 15, 10, 30)
  }
];

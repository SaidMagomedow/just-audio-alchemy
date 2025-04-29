import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { 
  Mic, 
  Volume2,
  Music, 
  MicOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  VolumeX,
  VolumeIcon,
  Download,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { TranscribedFile } from './FileList';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/auth';

interface AudioPlayerProps {
  file: TranscribedFile;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
  onTranscriptionSelect?: (text: string) => void;
}

const formatTime = (time: number): string => {
  if (isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  file, 
  onOpenAssistant, 
  onRemoveNoise, 
  onRemoveMelody, 
  onRemoveVocals,
  onTranscriptionSelect
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const enhancedAudioRef = useRef<HTMLAudioElement>(null);
  const vocalsAudioRef = useRef<HTMLAudioElement>(null);
  const instrumentalAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState('');
  const [activeAudio, setActiveAudio] = useState<'original' | 'enhanced' | 'vocals' | 'instrumental'>('original');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Локальные состояния для процессов обработки
  const [noiseStatus, setNoiseStatus] = useState<'idle' | 'processing' | 'completed'>(
    file.fileRemoveNoiseStatus === 'processing' || file.fileRemoveNoiseStatus === 'completed' 
      ? file.fileRemoveNoiseStatus 
      : 'idle'
  );
  const [melodyStatus, setMelodyStatus] = useState<'idle' | 'processing' | 'completed'>(
    file.fileRemoveMelodyStatus === 'processing' || file.fileRemoveMelodyStatus === 'completed'
      ? file.fileRemoveMelodyStatus
      : 'idle'
  );
  const [vocalsStatus, setVocalsStatus] = useState<'idle' | 'processing' | 'completed'>(
    file.fileRemoveVocalStatus === 'processing' || file.fileRemoveVocalStatus === 'completed'
      ? file.fileRemoveVocalStatus
      : 'idle'
  );
  
  // Синхронизация локальных состояний с пропсами при их изменении
  useEffect(() => {
    // Синхронизация статуса удаления шума
    if (file.fileRemoveNoiseStatus) {
      if (file.fileRemoveNoiseStatus === 'processing' || file.fileRemoveNoiseStatus === 'completed') {
        setNoiseStatus(file.fileRemoveNoiseStatus);
      }
    } else if ((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
               (file.removed_noise_file_url && file.removed_noise_file_url !== '')) {
      setNoiseStatus('completed');
    }
    
    // Синхронизация статуса удаления мелодии
    if (file.fileRemoveMelodyStatus) {
      if (file.fileRemoveMelodyStatus === 'processing' || file.fileRemoveMelodyStatus === 'completed') {
        setMelodyStatus(file.fileRemoveMelodyStatus);
      }
    } else if ((file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
               (file.removed_melody_file_url && file.removed_melody_file_url !== '')) {
      setMelodyStatus('completed');
    }
    
    // Синхронизация статуса удаления вокала
    if (file.fileRemoveVocalStatus) {
      if (file.fileRemoveVocalStatus === 'processing' || file.fileRemoveVocalStatus === 'completed') {
        setVocalsStatus(file.fileRemoveVocalStatus);
      }
    } else if ((file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
               (file.removed_vocals_file_url && file.removed_vocals_file_url !== '')) {
      setVocalsStatus('completed');
    }
  }, [
    file.fileRemoveNoiseStatus, file.removedNoiseFileUrl, file.removed_noise_file_url,
    file.fileRemoveMelodyStatus, file.removedMelodyFileUrl, file.removed_melody_file_url, 
    file.fileRemoveVocalStatus, file.removedVocalsFileUrl, file.removed_vocals_file_url
  ]);
  
  // Audio element references
  const getCurrentAudioRef = () => {
    switch(activeAudio) {
      case 'original':
        return audioRef;
      case 'enhanced':
        return enhancedAudioRef;
      case 'vocals':
        return vocalsAudioRef;
      case 'instrumental':
        return instrumentalAudioRef;
      default:
        return audioRef;
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    const enhancedAudio = enhancedAudioRef.current;
    const vocalsAudio = vocalsAudioRef.current;
    const instrumentalAudio = instrumentalAudioRef.current;
    
    if (!audio) return;
    
    const updateTime = () => {
      const currentRef = getCurrentAudioRef().current;
      if (currentRef) {
        setCurrentTime(currentRef.currentTime);
      }
    };
    
    const handleDurationChange = () => {
      const currentRef = getCurrentAudioRef().current;
      if (currentRef) {
        setDuration(currentRef.duration);
      }
    };
    
    const handleEnded = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setAudioError('Ошибка воспроизведения. Проверьте права доступа к файлу.');
      setIsPlaying(false);
    };
    
    // Add event listeners to all audio elements
    const audioElements = [audio, enhancedAudio, vocalsAudio, instrumentalAudio].filter(Boolean);
    
    audioElements.forEach(element => {
      element?.addEventListener('timeupdate', updateTime);
      element?.addEventListener('durationchange', handleDurationChange);
      element?.addEventListener('ended', handleEnded);
      element?.addEventListener('error', handleError);
    });
    
    return () => {
      audioElements.forEach(element => {
        element?.removeEventListener('timeupdate', updateTime);
        element?.removeEventListener('durationchange', handleDurationChange);
        element?.removeEventListener('ended', handleEnded);
        element?.removeEventListener('error', handleError);
      });
    };
  }, [activeAudio]);
  
  // Reset player when file changes or when switching between original/enhanced
  useEffect(() => {
    pauseAllAudio();
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    setAudioLoaded(false);
    
    // Don't load audio automatically, wait for play button
    if (audioRef.current) {
      audioRef.current.removeAttribute('src');
    }
    if (enhancedAudioRef.current) {
      enhancedAudioRef.current.removeAttribute('src');
    }
    if (vocalsAudioRef.current) {
      vocalsAudioRef.current.removeAttribute('src');
    }
    if (instrumentalAudioRef.current) {
      instrumentalAudioRef.current.removeAttribute('src');
    }
  }, [file, activeAudio]);
  
  const pauseAllAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    if (enhancedAudioRef.current) enhancedAudioRef.current.pause();
    if (vocalsAudioRef.current) vocalsAudioRef.current.pause();
    if (instrumentalAudioRef.current) instrumentalAudioRef.current.pause();
    setIsPlaying(false);
  };
  
  // This function loads the audio with proper auth headers when needed
  const loadAudioWithAuth = async () => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement) return false;
    
    // If audio is already loaded, don't reload
    if (audioLoaded && audioElement.src) return true;
    
    setAudioLoaded(false);
    setAudioError(null);
    
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        setAudioError('Ошибка авторизации. Пожалуйста, войдите в систему.');
        return false;
      }
      
      // Get current file key based on which audio is active
      let fileKey;
      switch(activeAudio) {
        case 'original':
          fileKey = file.audioUrl;
          break;
        case 'enhanced':
          // Check if audio is still processing
          if (noiseStatus === 'processing') {
            setAudioError('Аудио еще обрабатывается...');
            return false;
          }
          fileKey = file.removedNoiseFileUrl || file.removed_noise_file_url;
          break;
        case 'vocals':
          // Check if audio is still processing
          if (melodyStatus === 'processing') {
            setAudioError('Аудио еще обрабатывается...');
            return false;
          }
          fileKey = file.removedMelodyFileUrl || file.removed_melody_file_url;
          break;
        case 'instrumental':
          // Check if audio is still processing
          if (vocalsStatus === 'processing') {
            setAudioError('Аудио еще обрабатывается...');
            return false;
          }
          fileKey = file.removedVocalsFileUrl || file.removed_vocals_file_url;
          break;
        default:
          fileKey = file.audioUrl;
      }
      
      if (!fileKey) {
        setAudioError('URL файла не найден');
        return false;
      }
      
      // Create URL for audio download endpoint
      const downloadUrl = `${api.defaults.baseURL}/user-files/download?file_key=${fileKey}`;
      
      // Configure request with auth headers
      const headers = {
        'Authorization': `Bearer ${authToken}`
      };
      
      // Make an authorized fetch request to the download endpoint
      const response = await fetch(downloadUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
      }
      
      // 1) Получаем "сырые" байты
      const arrayBuffer = await response.arrayBuffer();
      
      // 2) Читаем Content-Type из заголовков (или ставим mp3 по умолчанию)
      let contentType = response.headers.get('Content-Type') || 'audio/mpeg';
      
      // Убеждаемся, что у нас аудио-тип (если сервер отдал application/octet-stream)
      if (contentType === 'application/octet-stream') {
        // Определяем тип по расширению файла
        if (fileKey.endsWith('.mp3')) {
          contentType = 'audio/mpeg';
        } else if (fileKey.endsWith('.wav')) {
          contentType = 'audio/wav';
        } else if (fileKey.endsWith('.ogg')) {
          contentType = 'audio/ogg';
        } else if (fileKey.endsWith('.flac')) {
          contentType = 'audio/flac';
        } else {
          contentType = 'audio/mpeg'; // По умолчанию mp3
        }
      }
      
      // 3) Явно создаём Blob с нужным MIME
      const blob = new Blob([arrayBuffer], { type: contentType });
      console.log('✅ blob size:', blob.size, 'type:', blob.type);
      
      // Проверяем, что blob не пустой
      if (blob.size === 0) {
        throw new Error('Получен пустой аудиофайл (размер 0 байт)');
      }
      
      const objectUrl = URL.createObjectURL(blob);
      
      // Сначала устанавливаем обработчик событий, затем загружаем аудио
      return new Promise<boolean>((resolve) => {
        const handleCanPlay = () => {
          console.log('Audio can play now!');
          setAudioLoaded(true);
          resolve(true);
        };

        const handleError = (e: Event) => {
          console.error('Error loading audio:', e);
          setAudioError('Ошибка загрузки аудио: формат не поддерживается');
          resolve(false);
        };

        audioElement.addEventListener('canplaythrough', handleCanPlay, { once: true });
        audioElement.addEventListener('error', handleError, { once: true });
        
        // Устанавливаем источник и начинаем загрузку
        audioElement.src = objectUrl;
        audioElement.load();
        
        // Устанавливаем таймаут на случай, если события не сработают
        setTimeout(() => {
          if (!audioElement.src) {
            setAudioError('Таймаут при загрузке аудио');
            resolve(false);
          }
        }, 100000); // 10 секунд таймаут
      });
      
    } catch (error) {
      console.error('Error loading audio:', error);
      setAudioError(`Ошибка загрузки аудио: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      return false;
    }
  };
  
  const togglePlayPause = async () => {
    if (isPlaying) {
      pauseAllAudio();
      return;
    }
    
    // If we have an error or need to load the audio
    if (audioError || !audioLoaded) {
      const success = await loadAudioWithAuth();
      if (!success) return; // If loading failed, don't try to play
    }
    
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement) return;
    
    try {
      // Воспроизводим звук, теперь мы уверены что аудио загружено и готово
      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError('Ошибка воспроизведения. Проверьте права доступа к файлу.');
    }
  };
  
  const handleSeek = (value: number[]) => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement || !audioLoaded) return;
    
    const newTime = value[0];
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement) return;
    
    const newVolume = value[0];
    audioElement.volume = newVolume;
    setVolume(newVolume);
  };
  
  const skipForward = () => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement || !audioLoaded) return;
    audioElement.currentTime = Math.min(audioElement.duration, currentTime + 10);
  };
  
  const skipBackward = () => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement || !audioLoaded) return;
    audioElement.currentTime = Math.max(0, currentTime - 10);
  };
  
  const toggleMute = () => {
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement) return;
    
    if (audioElement.volume > 0) {
      audioElement.volume = 0;
      setVolume(0);
    } else {
      audioElement.volume = 1;
      setVolume(1);
    }
  };
  
  const handleRealRemoveNoise = async () => {
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт в processing
      setNoiseStatus('processing');
      
      await api.post(`/audio/convert/file/remove-noise/${file.id}`);
      onRemoveNoise(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing noise:', error);
      toast.error('Ошибка при удалении шума');
      // Сбрасываем статус при ошибке
    }
  };
  
  const handleRealRemoveMelody = async () => {
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт в processing
      setMelodyStatus('processing');
      
      await api.post(`/audio/convert/file/remove-melody/${file.id}`);
      onRemoveMelody(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing melody:', error);
      toast.error('Ошибка при удалении мелодии');
      // Сбрасываем статус при ошибке
    }
  };
  
  const handleRealRemoveVocals = async () => {
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт в processing
      setVocalsStatus('processing');
      
      await api.post(`/audio/convert/file/remove-vocals/${file.id}`);
      onRemoveVocals(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing vocals:', error);
      toast.error('Ошибка при удалении вокала');
      // Сбрасываем статус при ошибке
    }
  };
  
  // Update handler functions to use real API calls
  const handleRemoveNoise = handleRealRemoveNoise;
  const handleRemoveMelody = handleRealRemoveMelody;
  const handleRemoveVocals = handleRealRemoveVocals;
  
  const handleOpenAssistant = () => {
    setIsProcessing(true);
    setProcessingType('Загрузка ассистента');
    
    // Мгновенный вызов
    setTimeout(() => {
      setIsProcessing(false);
      onOpenAssistant();
    }, 500);
  };
  
  const handleSwitchAudio = (value: string) => {
    pauseAllAudio();
    setActiveAudio(value as 'original' | 'enhanced' | 'vocals' | 'instrumental');
    setAudioLoaded(false); // Reset loaded state when switching
  };
  
  const handleDownloadAudio = async () => {
    // Get the current file key based on the active audio
    let fileKey;
    let fileType;
    
    switch(activeAudio) {
      case 'original':
        fileKey = file.audioUrl;
        fileType = 'original';
        break;
      case 'enhanced':
        fileKey = file.removedNoiseFileUrl || file.removed_noise_file_url;
        fileType = 'noise_removed';
        break;
      case 'vocals':
        fileKey = file.removedMelodyFileUrl || file.removed_melody_file_url;
        fileType = 'vocals_only';
        break;
      case 'instrumental':
        fileKey = file.removedVocalsFileUrl || file.removed_vocals_file_url;
        fileType = 'instrumental';
        break;
      default:
        fileKey = file.audioUrl;
        fileType = 'original';
    }
    
    if (!fileKey) return;
    
    try {
      // Get auth token
      const authToken = getAuthToken();
      if (!authToken) {
        toast.error('Ошибка авторизации. Пожалуйста, войдите в систему.');
        return;
      }
      
      // Create a download URL with the file key
      const downloadUrl = `${api.defaults.baseURL}/user-files/download?file_key=${fileKey}&stream=False`;
      
      // Make an authorized request to the file
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Extract filename from fileKey for better naming
      const fileName = fileKey.split('/').pop() || 'audio';
      link.download = `${fileName.split('.')[0]}_${fileType}.${fileName.split('.').pop()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка при скачивании файла. У вас может не быть прав доступа.');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Audio elements (hidden) - no src initially */}
      <audio 
        ref={audioRef}
        preload="none"
        className="hidden"
      />
      
      {((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
        (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
        noiseStatus === 'processing' || 
        noiseStatus === 'completed') && (
        <audio
          ref={enhancedAudioRef}
          preload="none"
          className="hidden"
        />
      )}
      
      {((file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
        (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
        melodyStatus === 'processing' || 
        melodyStatus === 'completed') && (
        <audio
          ref={vocalsAudioRef}
          preload="none"
          className="hidden"
        />
      )}
      
      {((file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
        (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
        vocalsStatus === 'processing' || 
        vocalsStatus === 'completed') && (
        <audio
          ref={instrumentalAudioRef}
          preload="none"
          className="hidden"
        />
      )}
      
      {/* Main player UI */}
      <div className="mb-8 w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Show tabs only if we have any processed files */}
          {((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
            (file.removed_noise_file_url && file.removed_noise_file_url !== '') ||
            noiseStatus === 'processing' ||
            (file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
            (file.removed_melody_file_url && file.removed_melody_file_url !== '') ||
            melodyStatus === 'processing' ||
            (file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
            (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') ||
            vocalsStatus === 'processing') && (
            <div className="mb-4">
              <Tabs value={activeAudio} onValueChange={handleSwitchAudio} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${getAvailableTracks().length}, 1fr)` }}>
                  <TabsTrigger value="original">Исходный файл</TabsTrigger>
                  {((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
                    (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                    noiseStatus === 'processing') && (
                    <TabsTrigger value="enhanced">
                      Файл без шума
                      {noiseStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </TabsTrigger>
                  )}
                  {((file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
                    (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                    melodyStatus === 'processing') && (
                    <TabsTrigger value="vocals">
                      Только вокал
                      {melodyStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </TabsTrigger>
                  )}
                  {((file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
                    (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                    vocalsStatus === 'processing') && (
                    <TabsTrigger value="instrumental">
                      Инструментал
                      {vocalsStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">
              {activeAudio === 'original' && 'Исходный файл'}
              {activeAudio === 'enhanced' && 'Файл с удаленным шумом'}
              {activeAudio === 'vocals' && 'Только вокал (без музыки)'}
              {activeAudio === 'instrumental' && 'Инструментал (без голоса)'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAudio}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Скачать</span>
            </Button>
          </div>

          {/* Display error message if there's an audio error */}
          {audioError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {audioError}
            </div>
          )}

          {/* Waveform / Progress visualization */}
          <div className="relative h-12 mb-2 bg-gray-100 rounded overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary/20"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
            {/* Fixed waveform pattern for visualization */}
            <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 mx-0.5 bg-gray-300"
                  style={{
                    height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 15}%`,
                    opacity: currentTime / duration > i / 40 ? 1 : 0.5
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Time indicators */}
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Playback controls */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={skipBackward}
              className="h-10 w-10"
              disabled={!audioLoaded}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={togglePlayPause}
              variant="default" 
              size="icon" 
              className="h-14 w-14 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={skipForward} 
              className="h-10 w-10"
              disabled={!audioLoaded}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Volume control */}
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
      
      {/* AI Tools section */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6">Инструменты AI</h3>
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="mb-6 flex items-center justify-center p-3 bg-blue-50 rounded-md">
              <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
              <p className="text-sm text-primary">{processingType}...</p>
            </div>
          )}
          
          {/* Processing status indicators for individual tracks */}
          {!isProcessing && (
            <>
              {noiseStatus === 'processing' && (
                <div className="mb-6 flex items-center justify-center p-3 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление шума...</p>
                </div>
              )}
              
              {melodyStatus === 'processing' && (
                <div className="mb-6 flex items-center justify-center p-3 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление музыки...</p>
                </div>
              )}
              
              {vocalsStatus === 'processing' && (
                <div className="mb-6 flex items-center justify-center p-3 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление вокала...</p>
                </div>
              )}
            </>
          )}
          
          {/* AI Tools grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TooltipProvider>
              
              <div className="flex flex-col">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleRemoveNoise}
                      variant="outline" 
                      className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                      disabled={isProcessing || 
                               (file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
                               (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                               noiseStatus === 'processing' || 
                               noiseStatus === 'completed'}
                    >
                      <Volume2 className="h-5 w-5 text-primary" />
                      <span>Удалить шум</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Автоматически очистить аудио от фоновых шумов</p>
                  </TooltipContent>
                </Tooltip>
                {((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
                  (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                  noiseStatus === 'completed') && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <CheckCircle className="h-3 w-3" />
                    Готово
                  </span>
                )}
                {noiseStatus === 'processing' && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Обработка...
                  </span>
                )}
              </div>
              
              <div className="flex flex-col">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleRemoveMelody}
                      variant="outline" 
                      className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                      disabled={isProcessing || 
                               (file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
                               (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                               melodyStatus === 'processing' || 
                               melodyStatus === 'completed'}
                    >
                      <Music className="h-5 w-5 text-primary" />
                      <span>Удалить мелодию</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Удалить музыкальное сопровождение, оставив только голос</p>
                  </TooltipContent>
                </Tooltip>
                {((file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
                  (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                  melodyStatus === 'completed') && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <CheckCircle className="h-3 w-3" />
                    Готово
                  </span>
                )}
                {melodyStatus === 'processing' && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Обработка...
                  </span>
                )}
              </div>
              
              <div className="flex flex-col">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleRemoveVocals}
                      variant="outline" 
                      className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                      disabled={isProcessing || 
                               (file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
                               (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                               vocalsStatus === 'processing' || 
                               vocalsStatus === 'completed'}
                    >
                      <MicOff className="h-5 w-5 text-primary" />
                      <span>Удалить вокал</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Удалить голос из аудио, оставив только дорожку</p>
                  </TooltipContent>
                </Tooltip>
                {((file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
                  (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                  vocalsStatus === 'completed') && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <CheckCircle className="h-3 w-3" />
                    Готово
                  </span>
                )}
                {vocalsStatus === 'processing' && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 mt-1 w-fit self-center">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Обработка...
                  </span>
                )}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper function to determine available audio tracks
  function getAvailableTracks() {
    const tracks = [{ id: 'original', label: 'Исходный файл' }];
    
    // Show enhanced track if it's available or processing
    if ((file.removedNoiseFileUrl && file.removedNoiseFileUrl !== '') || 
        (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
        noiseStatus === 'processing') {
      tracks.push({ id: 'enhanced', label: 'Файл без шума' });
    }
    
    // Show vocals track if it's available or processing
    if ((file.removedMelodyFileUrl && file.removedMelodyFileUrl !== '') || 
        (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
        melodyStatus === 'processing') {
      tracks.push({ id: 'vocals', label: 'Только вокал' });
    }
    
    // Show instrumental track if it's available or processing
    if ((file.removedVocalsFileUrl && file.removedVocalsFileUrl !== '') || 
        (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
        vocalsStatus === 'processing') {
      tracks.push({ id: 'instrumental', label: 'Инструментал' });
    }
    
    return tracks;
  }
};

export default AudioPlayer;

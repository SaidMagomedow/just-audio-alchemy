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
  Loader2,
  Lock,
  Sparkles
} from 'lucide-react';
import { TranscribedFile } from './FileList';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/auth';
import { UserProductPlan } from '@/types/userPlan';
import UpgradePlanModal from '../modals/UpgradePlanModal';
import EnhanceAudioButton from './EnhanceAudioButton';

interface AudioPlayerProps {
  file: TranscribedFile;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
  onEnhanceAudio: () => void;
  onTranscriptionSelect?: (text: string) => void;
  userPlan?: UserProductPlan;
  isLoading?: boolean;
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
  onEnhanceAudio,
  onTranscriptionSelect,
  userPlan,
  isLoading
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
  const [activeAudio, setActiveAudio] = useState<'original' | 'enhanced' | 'vocals' | 'instrumental' | 'improved'>('original');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Модальное окно для предложения улучшить подписку
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [featureToUpgrade, setFeatureToUpgrade] = useState('');
  
  // Проверка прав пользователя на основе подписки
  const canRemoveNoise = !!userPlan?.is_can_remove_noise;
  const canRemoveMelody = !!userPlan?.is_can_remove_melody;
  const canRemoveVocal = !!userPlan?.is_can_remove_vocal;
  const canEnhanceAudio = !!userPlan?.is_can_enhance_audio;
  
  // Используем статусы непосредственно из props вместо дублирования в локальный state
  const noiseStatus = file.fileRemoveNoiseStatus ?? 'idle';
  const melodyStatus = file.fileRemoveMelodyStatus ?? 'idle';
  const vocalsStatus = file.fileRemoveVocalStatus ?? 'idle';
  const improveStatus = file.fileImproveAudioStatus ?? 'idle';
  
  // Определяем URLs для обработанных файлов
  const noiseRemovedUrl = file.removedNoiseFileUrl || file.removed_noise_file_url;
  const melodyRemovedUrl = file.removedMelodyFileUrl || file.removed_melody_file_url;
  const vocalsRemovedUrl = file.removedVocalsFileUrl || file.removed_vocals_file_url;
  const improvedUrl = file.enhancedAudioFileUrl || file.enhanced_audio_file_url;
  
  // Автоматически переключаемся на вкладку улучшенного звука, когда статус меняется на processing
  useEffect(() => {
    if (improveStatus === 'processing' && activeAudio !== 'improved') {
      console.log('Автоматически переключаемся на вкладку улучшенного звука');
      handleSwitchAudio('improved');
    }
  }, [improveStatus, activeAudio]);
  
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
      case 'improved':
        return enhancedAudioRef;
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
          fileKey = noiseRemovedUrl;
          break;
        case 'vocals':
          // Check if audio is still processing
          if (melodyStatus === 'processing') {
            setAudioError('Аудио еще обрабатывается...');
            return false;
          }
          fileKey = melodyRemovedUrl;
          break;
        case 'instrumental':
          // Check if audio is still processing
          if (vocalsStatus === 'processing') {
            setAudioError('Аудио еще обрабатывается...');
            return false;
          }
          fileKey = vocalsRemovedUrl;
          break;
        case 'improved':
          fileKey = improvedUrl;
          break;
        default:
          fileKey = file.audioUrl;
      }
      
      if (!fileKey) {
        setAudioError('URL файла не найден');
        return false;
      }
      
      // Create URL for audio download endpoint
      const downloadUrl = `${api.defaults.baseURL}/user-files/download?file_key=${fileKey}&stream=True`;
      
      // Установка обработчиков событий
      const handleCanPlay = () => {
        console.log('Audio can play now!');
        setAudioLoaded(true);
      };

      const handleError = (e: Event) => {
        console.error('Error loading audio:', e);
        setAudioError('Ошибка загрузки аудио: формат не поддерживается');
      };

      audioElement.addEventListener('canplay', handleCanPlay, { once: true });
      audioElement.addEventListener('error', handleError, { once: true });
      
      // Настройка атрибутов для потокового воспроизведения
      audioElement.preload = 'auto';
      
      // Напрямую устанавливаем src с URL, включающим заголовки авторизации
      // MediaSource API или srcObject не поддерживают передачу заголовков,
      // поэтому используем прокси через медиа-эндпоинт нашего API,
      // который уже включает авторизацию
      audioElement.src = downloadUrl;
      
      // Вставляем заголовок авторизации в объект audio
      // Так как audio.src не позволяет передать заголовки напрямую,
      // используем прокси-запрос к нашему API с токеном в query params
      audioElement.crossOrigin = 'anonymous';
      
      // Устанавливаем заголовок авторизации через дополнительный параметр в URL
      audioElement.src = `${downloadUrl}&auth_token=${encodeURIComponent(authToken)}`;
      
      return new Promise<boolean>((resolve) => {
        // Устанавливаем дополнительные обработчики для Promise
        const canPlayHandler = () => {
          resolve(true);
        };
        
        const errorHandler = () => {
          resolve(false);
        };
        
        audioElement.addEventListener('canplay', canPlayHandler, { once: true });
        audioElement.addEventListener('error', errorHandler, { once: true });
        
        // Запускаем загрузку
        audioElement.load();
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
    
    const audioElement = getCurrentAudioRef().current;
    if (!audioElement) return;
    
    // Если у нас ошибка или аудио еще не загружено
    if (audioError || !audioLoaded) {
      // Начинаем загрузку аудио
      const loadingStarted = await loadAudioWithAuth();
      if (!loadingStarted) return; // Если не удалось начать загрузку
    }
    
    try {
      // Пытаемся начать воспроизведение сразу, не дожидаясь полной загрузки
      // Браузер сам будет управлять буферизацией и воспроизведением
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
    audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
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
  
  // Add debug logging at the top level
  useEffect(() => {
    console.log('props statuses:', {
      noise: file.fileRemoveNoiseStatus,
      melody: file.fileRemoveMelodyStatus,
      vocals: file.fileRemoveVocalStatus,
      improve: file.fileImproveAudioStatus
    });
    console.log('local activeAudio:', activeAudio);
  }, [file, activeAudio]);
  
  const handleRealRemoveNoise = async () => {
    // Проверяем права подписки
    if (!canRemoveNoise) {
      setFeatureToUpgrade('Удаление шума');
      setShowUpgradeModal(true);
      return;
    }
    
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт через callback функции
      setIsProcessing(true);
      setProcessingType('Удаление шума');
      
      await api.post(`/audio/convert/file/remove-noise/${file.id}`);
      onRemoveNoise(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing noise:', error);
      toast.error('Ошибка при удалении шума');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRealRemoveMelody = async () => {
    // Проверяем права подписки
    if (!canRemoveMelody) {
      setFeatureToUpgrade('Удаление мелодии');
      setShowUpgradeModal(true);
      return;
    }
    
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт через callback функции
      setIsProcessing(true);
      setProcessingType('Удаление мелодии');
      
      await api.post(`/audio/convert/file/remove-melody/${file.id}`);
      onRemoveMelody(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing melody:', error);
      toast.error('Ошибка при удалении мелодии');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRealRemoveVocals = async () => {
    // Проверяем права подписки
    if (!canRemoveVocal) {
      setFeatureToUpgrade('Удаление вокала');
      setShowUpgradeModal(true);
      return;
    }
    
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт через callback функции
      setIsProcessing(true);
      setProcessingType('Удаление вокала');
      
      await api.post(`/audio/convert/file/remove-vocals/${file.id}`);
      onRemoveVocals(); // Обновить данные файла
    } catch (error) {
      console.error('Error removing vocals:', error);
      toast.error('Ошибка при удалении вокала');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Обработчик закрытия модального окна
  const handleCloseUpgradeModal = () => {
    setShowUpgradeModal(false);
  };
  
  // Update handler functions to use real API calls
  const handleRemoveNoise = handleRealRemoveNoise;
  const handleRemoveMelody = handleRealRemoveMelody;
  const handleRemoveVocals = handleRealRemoveVocals;
  
  const handleRealEnhanceAudio = async (presetId: string = 'smart_enhancement') => {
    // Проверяем права подписки (можно удалить при релизе)
    if (!canEnhanceAudio) {
      setFeatureToUpgrade('Улучшение звука');
      setShowUpgradeModal(true);
      return;
    }
    
    if (!file.id) return;
    
    try {
      // Устанавливаем локальный стейт через callback функции
      setIsProcessing(true);
      setProcessingType('Улучшение звука');
      
      // Автоматически переключаемся на вкладку улучшенного звука
      handleSwitchAudio('improved');
      
      await api.post(`/audio/convert/file/enhance-audio/${file.id}?enhance_preset=${presetId}`);
      console.log('API запрос выполнен успешно с пресетом:', presetId);
      
      // После успешного API запроса обновляем данные файла
      onEnhanceAudio(); 
    } catch (error) {
      console.error('Error enhancing audio:', error);
      toast.error('Ошибка при улучшении звука');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleEnhanceAudio = handleRealEnhanceAudio;
  
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
    setActiveAudio(value as 'original' | 'enhanced' | 'vocals' | 'instrumental' | 'improved');
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
        fileKey = noiseRemovedUrl;
        fileType = 'noise_removed';
        break;
      case 'vocals':
        fileKey = melodyRemovedUrl;
        fileType = 'vocals_only';
        break;
      case 'instrumental':
        fileKey = vocalsRemovedUrl;
        fileType = 'instrumental';
        break;
      case 'improved':
        fileKey = improvedUrl;
        fileType = 'improved';
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
      
      {((noiseRemovedUrl && noiseRemovedUrl !== '') || 
        (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
        noiseStatus === 'processing' || noiseStatus === 'failed' ||
        (melodyRemovedUrl && melodyRemovedUrl !== '') || 
        (file.removed_melody_file_url && file.removed_melody_file_url !== '') ||
        melodyStatus === 'processing' || melodyStatus === 'failed' ||
        (vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
        (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') ||
        vocalsStatus === 'processing' || vocalsStatus === 'failed' ||
        (improvedUrl && improvedUrl !== '') || 
        (file.enhanced_audio_file_url && file.enhanced_audio_file_url !== '') ||
        improveStatus === 'processing' || improveStatus === 'failed') && (
        <audio
          ref={enhancedAudioRef}
          preload="none"
          className="hidden"
        />
      )}
      
      {((melodyRemovedUrl && melodyRemovedUrl !== '') || 
        (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
        melodyStatus === 'processing' || melodyStatus === 'failed') && (
        <audio
          ref={vocalsAudioRef}
          preload="none"
          className="hidden"
        />
      )}
      
      {((vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
        (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
        vocalsStatus === 'processing' || vocalsStatus === 'failed') && (
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
          {((noiseRemovedUrl && noiseRemovedUrl !== '') || 
            (file.removed_noise_file_url && file.removed_noise_file_url !== '') ||
            noiseStatus === 'processing' || noiseStatus === 'failed' ||
            (melodyRemovedUrl && melodyRemovedUrl !== '') || 
            (file.removed_melody_file_url && file.removed_melody_file_url !== '') ||
            melodyStatus === 'processing' || melodyStatus === 'failed' ||
            (vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
            (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') ||
            vocalsStatus === 'processing' || vocalsStatus === 'failed' ||
            (improvedUrl && improvedUrl !== '') || 
            (file.enhanced_audio_file_url && file.enhanced_audio_file_url !== '') ||
            improveStatus === 'processing' || improveStatus === 'failed') && (
            <div className="mb-4">
              <Tabs value={activeAudio} onValueChange={handleSwitchAudio} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${getAvailableTracks().length}, 1fr)` }}>
                  <TabsTrigger value="original">Исходный файл</TabsTrigger>
                  {((noiseRemovedUrl && noiseRemovedUrl !== '') || 
                    (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                    noiseStatus === 'processing' || noiseStatus === 'failed') && (
                    <TabsTrigger value="enhanced">
                      Файл без шума
                      {noiseStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                      {noiseStatus === 'failed' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-red-500"></div>
                      )}
                    </TabsTrigger>
                  )}
                  {((melodyRemovedUrl && melodyRemovedUrl !== '') || 
                    (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                    melodyStatus === 'processing' || melodyStatus === 'failed') && (
                    <TabsTrigger value="vocals">
                      Только вокал
                      {melodyStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                      {melodyStatus === 'failed' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-red-500"></div>
                      )}
                    </TabsTrigger>
                  )}
                  {((vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
                    (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                    vocalsStatus === 'processing' || vocalsStatus === 'failed') && (
                    <TabsTrigger value="instrumental">
                      Инструментал
                      {vocalsStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                      {vocalsStatus === 'failed' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-red-500"></div>
                      )}
                    </TabsTrigger>
                  )}
                  {/* Принудительно показываем вкладку улучшенного звука, когда статус processing, 
                     даже если файлы еще не доступны */}
                  {(improveStatus === 'processing' || improveStatus === 'completed' || 
                    improveStatus === 'failed' || (improvedUrl && improvedUrl !== '')) && (
                    <TabsTrigger value="improved">
                      Улучшенный звук
                      {improveStatus === 'processing' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      )}
                      {improveStatus === 'failed' && (
                        <div className="ml-1 h-3 w-3 rounded-full bg-red-500"></div>
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
              {activeAudio === 'improved' && 'Улучшенный звук AI'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAudio}
              className="flex items-center gap-1"
              disabled={
                (activeAudio === 'enhanced' && noiseStatus === 'failed') ||
                (activeAudio === 'vocals' && melodyStatus === 'failed') ||
                (activeAudio === 'instrumental' && vocalsStatus === 'failed') ||
                (activeAudio === 'improved' && improveStatus === 'failed')
              }
            >
              <Download className="h-4 w-4" />
              <span>Скачать</span>
            </Button>
          </div>

          {/* Display error message if processing failed */}
          {((activeAudio === 'enhanced' && noiseStatus === 'failed') ||
            (activeAudio === 'vocals' && melodyStatus === 'failed') ||
            (activeAudio === 'instrumental' && vocalsStatus === 'failed')) && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              Обработка прошла с ошибкой. Попробуйте немного позднее.
            </div>
          )}

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
      <div className="w-full max-w-4xl mx-auto mb-32">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Инструменты AI</h3>
          
          {/* Processing indicators - Fixed position wrapper with minimum height */}
          <div className="h-auto mb-4">
            <div className="space-y-2">
              {isProcessing && (
                <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">{processingType}...</p>
                </div>
              )}
              
              {!isProcessing && noiseStatus === 'processing' && (
                <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление шума...</p>
                </div>
              )}
              
              {!isProcessing && melodyStatus === 'processing' && (
                <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление музыки...</p>
                </div>
              )}
              
              {!isProcessing && vocalsStatus === 'processing' && (
                <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Удаление вокала...</p>
                </div>
              )}
              
              {!isProcessing && improveStatus === 'processing' && (
                <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                  <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                  <p className="text-sm text-primary">Улучшение звука с AI...</p>
                </div>
              )}
            </div>
          </div>
          
          {/* AI Tools grid - New layout with 2 buttons per row, more compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TooltipProvider>
              {/* First row - Enhanced Audio (Featured) and Remove Noise */}
              <div className="flex gap-3">
                {/* Enhanced Audio Button - заменен на новый компонент */}
                <EnhanceAudioButton 
                  onEnhance={handleEnhanceAudio}
                  disabled={isProcessing}
                  status={improveStatus}
                  hasImprovedAudio={!!(improvedUrl && improvedUrl !== '')}
                />
                
                {/* Remove Noise Button */}
                <div className="flex flex-col h-[75px] flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleRemoveNoise}
                        variant="outline" 
                        className="flex items-center gap-1.5 h-10 py-1 w-full justify-start"
                        disabled={isProcessing || 
                                 (noiseRemovedUrl && noiseRemovedUrl !== '') || 
                                 (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                                 noiseStatus === 'processing'}
                      >
                        {!canRemoveNoise && <Lock className="h-3.5 w-3.5 mr-1" />}
                        <Volume2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Удалить шум</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Автоматически очистить аудио от фоновых шумов</p>
                      {!canRemoveNoise && <p className="text-xs text-red-500 mt-1">Требуется улучшение подписки</p>}
                    </TooltipContent>
                  </Tooltip>
                  <div className="h-6 flex justify-center items-center mt-1">
                  {((noiseRemovedUrl && noiseRemovedUrl !== '') || 
                    (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
                    noiseStatus === 'completed') ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Готово
                    </span>
                  ) : noiseStatus === 'processing' ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Обработка...
                    </span>
                  ) : noiseStatus === 'failed' ? (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      Ошибка
                    </span>
                  ) : (
                    <span className="h-5"></span>
                  )}
                  </div>
                </div>
              </div>
              
              {/* Second row - Remove Melody and Remove Vocals */}
              <div className="flex gap-3">
                {/* Remove Melody Button */}  
                <div className="flex flex-col h-[75px] flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleRemoveMelody}
                        variant="outline" 
                        className="flex items-center gap-1.5 h-10 py-1 w-full justify-start"
                        disabled={isProcessing || 
                                 (melodyRemovedUrl && melodyRemovedUrl !== '') || 
                                 (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                                 melodyStatus === 'processing'}
                      >
                        {!canRemoveMelody && <Lock className="h-3.5 w-3.5 mr-1" />}
                        <Music className="h-4 w-4 text-primary" />
                        <span className="text-sm">Удалить мелодию</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Удалить музыкальное сопровождение, оставив только голос</p>
                      {!canRemoveMelody && <p className="text-xs text-red-500 mt-1">Требуется улучшение подписки</p>}
                    </TooltipContent>
                  </Tooltip>
                  <div className="h-6 flex justify-center items-center mt-1">
                  {((melodyRemovedUrl && melodyRemovedUrl !== '') || 
                    (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
                    melodyStatus === 'completed') ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Готово
                    </span>
                  ) : melodyStatus === 'processing' ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Обработка...
                    </span>
                  ) : melodyStatus === 'failed' ? (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      Ошибка
                    </span>
                  ) : (
                    <span className="h-5"></span>
                  )}
                  </div>
                </div>
                
                {/* Remove Vocals Button */}
                <div className="flex flex-col h-[75px] flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleRemoveVocals}
                        variant="outline" 
                        className="flex items-center gap-1.5 h-10 py-1 w-full justify-start"
                        disabled={isProcessing || 
                                 (vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
                                 (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                                 vocalsStatus === 'processing'}
                      >
                        {!canRemoveVocal && <Lock className="h-3.5 w-3.5 mr-1" />}
                        <MicOff className="h-4 w-4 text-primary" />
                        <span className="text-sm">Удалить вокал</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Удалить голос из аудио, оставив только дорожку</p>
                      {!canRemoveVocal && <p className="text-xs text-red-500 mt-1">Требуется улучшение подписки</p>}
                    </TooltipContent>
                  </Tooltip>
                  <div className="h-6 flex justify-center items-center mt-1">
                  {((vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
                    (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
                    vocalsStatus === 'completed') ? (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Готово
                    </span>
                  ) : vocalsStatus === 'processing' ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Обработка...
                    </span>
                  ) : vocalsStatus === 'failed' ? (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      Ошибка
                    </span>
                  ) : (
                    <span className="h-5"></span>
                  )}
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>
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
  
  // Helper function to determine available audio tracks
  function getAvailableTracks() {
    console.log('Проверка доступных треков. Статус улучшения аудио:', improveStatus);
    console.log('Файлы с улучшенным звуком:', {
      improvedUrl: improvedUrl
    });
    
    const tracks = [{ id: 'original', label: 'Исходный файл' }];
    
    // Show enhanced track if it's available or processing or failed
    if ((noiseRemovedUrl && noiseRemovedUrl !== '') || 
        (file.removed_noise_file_url && file.removed_noise_file_url !== '') || 
        noiseStatus === 'processing' || noiseStatus === 'failed') {
      tracks.push({ id: 'enhanced', label: 'Файл без шума' });
    }
    
    // Show vocals track if it's available or processing or failed
    if ((melodyRemovedUrl && melodyRemovedUrl !== '') || 
        (file.removed_melody_file_url && file.removed_melody_file_url !== '') || 
        melodyStatus === 'processing' || melodyStatus === 'failed') {
      tracks.push({ id: 'vocals', label: 'Только вокал' });
    }
    
    // Show instrumental track if it's available or processing or failed
    if ((vocalsRemovedUrl && vocalsRemovedUrl !== '') || 
        (file.removed_vocals_file_url && file.removed_vocals_file_url !== '') || 
        vocalsStatus === 'processing' || vocalsStatus === 'failed') {
      tracks.push({ id: 'instrumental', label: 'Инструментал' });
    }
    
    // Show improved audio track if it's available or processing or failed
    if ((improvedUrl && improvedUrl !== '') || 
        improveStatus === 'processing' || improveStatus === 'failed') {
      console.log('Добавляем вкладку улучшенного звука');
      tracks.push({ id: 'improved', label: 'Улучшенный звук' });
    }
    
    return tracks;
  }
};

export default AudioPlayer;

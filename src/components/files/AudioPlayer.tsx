
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
  VolumeX
} from 'lucide-react';
import { TranscribedFile } from './FileList';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Reset player when file changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [file]);
  
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.duration, currentTime + 10);
  };
  
  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, currentTime - 10);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.volume > 0) {
      audioRef.current.volume = 0;
      setVolume(0);
    } else {
      audioRef.current.volume = 1;
      setVolume(1);
    }
  };
  
  // Simulate AI processing function
  const handleAIProcessing = (type: string, callback: () => void) => {
    setIsProcessing(true);
    setProcessingType(type);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          callback();
          return 0;
        }
        return prev + 5;
      });
    }, 200);
  };
  
  const handleRemoveNoise = () => {
    handleAIProcessing('Удаление шума', onRemoveNoise);
  };
  
  const handleRemoveMelody = () => {
    handleAIProcessing('Удаление мелодии', onRemoveMelody);
  };
  
  const handleRemoveVocals = () => {
    handleAIProcessing('Удаление вокала', onRemoveVocals);
  };
  
  const handleOpenAssistant = () => {
    handleAIProcessing('Загрузка ассистента', onOpenAssistant);
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Audio element (hidden) */}
      <audio 
        ref={audioRef}
        src={file.audioUrl}
        preload="metadata"
        className="hidden"
      />
      
      {/* Main player UI */}
      <div className="mb-8 w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6">Прослушать исходный файл</h3>
          
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
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{processingType}...</p>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* AI Tools grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleOpenAssistant}
                    variant="outline" 
                    className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                    disabled={isProcessing}
                  >
                    <Mic className="h-5 w-5 text-primary" />
                    <span>CPT ассистент</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Открыть диалог с ассистентом для работы с аудио</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleRemoveNoise}
                    variant="outline" 
                    className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                    disabled={isProcessing}
                  >
                    <Volume2 className="h-5 w-5 text-primary" />
                    <span>Удалить шум</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Автоматически очистить аудио от фоновых шумов</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleRemoveMelody}
                    variant="outline" 
                    className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                    disabled={isProcessing}
                  >
                    <Music className="h-5 w-5 text-primary" />
                    <span>Удалить мелодию</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Удалить музыкальное сопровождение, оставив только голос</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleRemoveVocals}
                    variant="outline" 
                    className="flex items-center gap-2 h-auto py-3 w-full justify-start"
                    disabled={isProcessing}
                  >
                    <MicOff className="h-5 w-5 text-primary" />
                    <span>Удалить вокал</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Удалить голос из аудио, оставив только музыку</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

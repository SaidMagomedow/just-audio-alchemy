
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Volume2,
  Music, 
  MicOff
} from 'lucide-react';
import { TranscribedFile } from './FileList';

interface AudioPlayerProps {
  file: TranscribedFile;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  file, 
  onOpenAssistant, 
  onRemoveNoise, 
  onRemoveMelody, 
  onRemoveVocals 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-gray-50 rounded-lg p-6 flex flex-col items-center">
        <h3 className="text-lg font-medium mb-4">Прослушать исходный файл</h3>
        
        <audio 
          ref={audioRef}
          controls 
          className="w-full mb-6" 
          src={file.audioUrl}
        >
          Ваш браузер не поддерживает аудио элемент.
        </audio>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Button 
            onClick={onOpenAssistant}
            variant="outline" 
            className="flex items-center gap-2 h-auto py-3"
          >
            <Mic className="h-5 w-5" />
            <span>CPT ассистент</span>
          </Button>
          
          <Button 
            onClick={onRemoveNoise}
            variant="outline" 
            className="flex items-center gap-2 h-auto py-3"
          >
            <Volume2 className="h-5 w-5" />
            <span>Удалить шум</span>
          </Button>
          
          <Button 
            onClick={onRemoveMelody}
            variant="outline" 
            className="flex items-center gap-2 h-auto py-3"
          >
            <Music className="h-5 w-5" />
            <span>Удалить мелодию</span>
          </Button>
          
          <Button 
            onClick={onRemoveVocals}
            variant="outline" 
            className="flex items-center gap-2 h-auto py-3"
          >
            <MicOff className="h-5 w-5" />
            <span>Удалить вокал</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

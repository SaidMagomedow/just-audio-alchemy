
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mic, Volume2, Music, MicOff } from 'lucide-react';
import { TranscribedFile } from './FileList';

interface FileHeaderProps {
  file: TranscribedFile;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
}

// Format date utility
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const FileHeader: React.FC<FileHeaderProps> = ({ 
  file, 
  onOpenAssistant, 
  onRemoveNoise, 
  onRemoveMelody, 
  onRemoveVocals 
}) => {
  return (
    <div className="p-4 border-b flex justify-between items-center">
      <div>
        <h3 className="font-medium">{file.name}</h3>
        <p className="text-sm text-gray-500">
          {formatDate(file.date)} • {file.duration}
        </p>
      </div>
      
      {/* Dropdown menu for file options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Опции
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onOpenAssistant} className="cursor-pointer flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span>CPT ассистент</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRemoveNoise} className="cursor-pointer flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Удалить шум</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRemoveMelody} className="cursor-pointer flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span>Удалить мелодию</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRemoveVocals} className="cursor-pointer flex items-center gap-2">
            <MicOff className="h-4 w-4" />
            <span>Удалить вокал</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FileHeader;

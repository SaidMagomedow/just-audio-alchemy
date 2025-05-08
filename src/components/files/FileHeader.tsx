import React from 'react';
import { TranscribedFile } from './FileList';

interface FileHeaderProps {
  file: TranscribedFile;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
  onEnhanceAudio: () => void;
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
}) => {
  return (
    <div className="p-4 border-b flex justify-between items-center">
      <div>
        <h3 className="font-medium">{file.name}</h3>
        <p className="text-sm text-gray-500">
          {formatDate(file.date)} • {file.duration}
        </p>
      </div>
  
    </div>
  );
};

export default FileHeader;

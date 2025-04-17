
import React from 'react';
import { File } from 'lucide-react';

// Types for transcribed files
export interface TranscribedFile {
  id: string;
  name: string;
  date: Date;
  duration: string;
  audioUrl: string;
}

interface FileListProps {
  files: TranscribedFile[];
  selectedFileId: string | null;
  onFileSelect: (file: TranscribedFile) => void;
}

// Format date utility
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const FileList: React.FC<FileListProps> = ({ files, selectedFileId, onFileSelect }) => {
  return (
    <div className="w-full md:w-1/3 border rounded-lg shadow-sm overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-medium">Расшифрованные файлы</h3>
      </div>
      <div className="p-2">
        {files.map(file => (
          <div 
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${selectedFileId === file.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
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
  );
};

export default FileList;

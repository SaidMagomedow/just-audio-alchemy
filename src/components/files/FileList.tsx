import React, { useState } from 'react';
import { File, Search, Calendar, SlidersHorizontal } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

// Types for transcribed files
export interface TranscribedFile {
  id: string;
  name: string;
  date: Date;
  duration: string;
  audioUrl: string;
  status?: 'completed' | 'processing' | 'error';
  transcription?: any;
  fileSize?: number;
  mimeType?: string;
  // Formatted transcriptions from backend
  transcription_text?: string;
  transcription_vtt?: string;
  transcription_srt?: string;
  // CamelCase versions (frontend)
  removedNoiseFileUrl?: string;
  removedMelodyFileUrl?: string;
  removedVocalsFileUrl?: string;
  // Snake_case versions (from API)
  removed_noise_file_url?: string;
  removed_melody_file_url?: string;
  removed_vocals_file_url?: string;
  // Processing status from backend enums
  fileRemoveNoiseStatus?: 'not started' | 'processing' | 'completed';
  fileRemoveMelodyStatus?: 'not started' | 'processing' | 'completed';
  fileRemoveVocalStatus?: 'not started' | 'processing' | 'completed';
  fileImproveAudioStatus?: 'not started' | 'processing' | 'completed';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Filter files based on search term, date, and status
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || file.date.toDateString() === filterDate.toDateString();
    const matchesStatus = !filterStatus || file.status === filterStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate(undefined);
    setFilterStatus(null);
  };

  return (
    <div className="w-full md:w-1/3 border rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium">Расшифрованные файлы</h3>
      </div>
      
      {/* Search and filter controls */}
      <div className="p-3 border-b">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Поиск файлов..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Фильтры</h4>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Статус:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={filterStatus === 'completed' ? 'default' : 'outline'} 
                      className="cursor-pointer"
                      onClick={() => setFilterStatus(filterStatus === 'completed' ? null : 'completed')}
                    >
                      Завершено
                    </Badge>
                    <Badge 
                      variant={filterStatus === 'processing' ? 'default' : 'outline'} 
                      className="cursor-pointer"
                      onClick={() => setFilterStatus(filterStatus === 'processing' ? null : 'processing')}
                    >
                      В обработке
                    </Badge>
                    <Badge 
                      variant={filterStatus === 'error' ? 'default' : 'outline'} 
                      className="cursor-pointer"
                      onClick={() => setFilterStatus(filterStatus === 'error' ? null : 'error')}
                    >
                      Ошибка
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Дата:</p>
                  <CalendarComponent
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    className="rounded-md border"
                  />
                </div>
                
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Active filters */}
        {(filterDate || filterStatus) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filterDate && (
              <Badge variant="secondary" className="flex gap-1 items-center">
                <Calendar className="h-3 w-3" />
                {formatDate(filterDate)}
                <button onClick={() => setFilterDate(undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {filterStatus && (
              <Badge variant="secondary" className="flex gap-1 items-center">
                Статус: {filterStatus === 'completed' ? 'Завершено' : 
                          filterStatus === 'processing' ? 'В обработке' : 'Ошибка'}
                <button onClick={() => setFilterStatus(null)} className="ml-1">×</button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length > 0 ? (
          <div className="p-2">
            {filteredFiles.map(file => (
              <div 
                key={file.id}
                onClick={() => onFileSelect(file)}
                className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 
                  ${selectedFileId === file.id 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-gray-50'}`}
              >
                <File className={`h-5 w-5 mt-1 flex-shrink-0 ${selectedFileId === file.id ? 'text-primary' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${selectedFileId === file.id ? 'text-primary' : ''}`}>
                    {file.name}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <span>{formatDate(file.date)}</span>
                    <span>•</span>
                    <span>{file.duration}</span>
                    {file.status && (
                      <>
                        <span>•</span>
                        <span>{file.status === 'completed' ? 'Завершено' : 
                                file.status === 'processing' ? 'В обработке' : 'Ошибка'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Search className="h-6 w-6 mb-2" />
            <p>Файлы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;

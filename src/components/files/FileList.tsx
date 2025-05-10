import React, { useState, useCallback, useRef } from 'react';
import { File, Search, Calendar, SlidersHorizontal, Plus, X, AlertCircle, CheckCircle, Clock, FileAudio, Upload } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from '@/lib/api';
import axios, { CancelTokenSource } from 'axios';

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
  enhancedAudioFileUrl?: string;
  // Snake_case versions (from API)
  removed_noise_file_url?: string;
  removed_melody_file_url?: string;
  removed_vocals_file_url?: string;
  enhanced_audio_file_url?: string;
  // Processing status from backend enums
  fileTranscriptionStatus?: 'not started' | 'processing' | 'completed' | 'failed';
  fileRemoveNoiseStatus?: 'not started' | 'processing' | 'completed' | 'failed';
  fileRemoveMelodyStatus?: 'not started' | 'processing' | 'completed' | 'failed';
  fileRemoveVocalStatus?: 'not started' | 'processing' | 'completed' | 'failed';
  fileImproveAudioStatus?: 'not started' | 'processing' | 'completed' | 'failed';
}

// New interface for selected file with upload state
interface SelectedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  fileId?: string;
  cancelToken?: CancelTokenSource;
}

interface FileListProps {
  files: TranscribedFile[];
  selectedFileId: string | null;
  onFileSelect: (file: TranscribedFile) => void;
  onNewFileLoaded?: (fileData: any) => void;
  onRefreshFiles?: () => void;
}

// Format file size utility
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Format date utility
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const FileList: React.FC<FileListProps> = ({ 
  files, 
  selectedFileId, 
  onFileSelect, 
  onNewFileLoaded,
  onRefreshFiles
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Toggle upload panel
  const toggleUploadPanel = () => {
    setShowUploadPanel(prev => !prev);
  };
  
  // Handle file selection via input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);
  
  // Remove file from upload queue
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Cancel upload if it's in progress
      if (newFiles[index].cancelToken && newFiles[index].status === 'uploading') {
        newFiles[index].cancelToken.cancel('Upload canceled by user');
      }
      return newFiles.filter((_, i) => i !== index);
    });
  };
  
  // Upload single file
  const uploadFile = async (file: SelectedFile, index: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      
      // Create cancel token
      const cancelTokenSource = axios.CancelToken.source();
      
      // Update file with cancel token
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, cancelToken: cancelTokenSource, status: 'uploading' } : f
      ));
      
      const response = await api.post('/audio/convert/file/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        cancelToken: cancelTokenSource.token,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setSelectedFiles(prev => prev.map((f, i) => 
              i === index ? { 
                ...f, 
                progress: percentCompleted,
                status: 'uploading'
              } : f
            ));
          }
        }
      });
      
      // Update file status to completed
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          progress: 100,
          status: 'completed',
          fileId: response.data.file_id
        } : f
      ));
      
      // Notify parent about new file
      if (onNewFileLoaded) {
        onNewFileLoaded(response.data);
      }
      
      return response.data.file_id;
    } catch (error) {
      // Skip canceled uploads
      if (axios.isCancel(error)) {
        console.log('Upload canceled:', error.message);
        return null;
      }
      
      console.error('Error uploading file:', error);
      setSelectedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error'
        } : f
      ));
      
      toast.error("Не удалось загрузить файл. Попробуйте еще раз.");
      
      return null;
    }
  };
  
  // Start uploading all pending files
  const handleUpload = async () => {
    // Check if there are files to upload
    const pendingFiles = selectedFiles.filter(file => file.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    setIsUploading(true);
    
    // Upload each pending file
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].status === 'pending') {
        await uploadFile(selectedFiles[i], i);
      }
    }
    
    setIsUploading(false);
    
    // Refresh files list after all uploads are completed
    if (onRefreshFiles) {
      onRefreshFiles();
      toast.success('Все файлы загружены, список обновлен');
    }
  };
  
  // Get file icon based on status
  const getFileIcon = (file: SelectedFile) => {
    if (file.status === 'error') return <AlertCircle className="text-red-500" size={18} />;
    if (file.status === 'completed') return <CheckCircle className="text-green-500" size={18} />;
    if (file.status === 'uploading') return <Clock className="text-blue-500 animate-pulse" size={18} />;
    return <FileAudio className="text-gray-500" size={18} />;
  };
  
  // Get status text based on file status
  const getStatusText = (file: SelectedFile) => {
    switch (file.status) {
      case 'error': return <span className="text-red-500 text-xs">Ошибка</span>;
      case 'completed': return <span className="text-green-500 text-xs">Готово</span>;
      case 'uploading': return <span className="text-blue-500 text-xs">{file.progress}%</span>;
      default: return <span className="text-gray-500 text-xs">В очереди</span>;
    }
  };

  return (
    <div className="w-full md:w-1/3 border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Расшифрованные файлы</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleUploadPanel} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Добавить файл</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Upload panel */}
      {showUploadPanel && (
        <div className="p-3 border-b animate-in fade-in-0 duration-200">
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <p className="text-center text-gray-600 mb-4">Перетащите файлы или нажмите кнопку</p>
            
            <input
              type="file"
              multiple
              accept="audio/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <Button 
              variant="outline" 
              className="w-full bg-black hover:bg-[#F97316] text-white hover:text-white "
              onClick={() => fileInputRef.current?.click()}
            >
              Загрузить файлы
            </Button>
          </div>
        </div>
      )}
      
      {/* Selected files for upload */}
      {selectedFiles.length > 0 && (
        <div className="p-3 border-b animate-in fade-in-0 duration-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Загрузка ({selectedFiles.length})</h4>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFiles.some(f => f.status === 'pending')}
              className="h-7"
            >
              {isUploading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {selectedFiles.map((file, index) => (
              <div key={`upload-${index}`} className="relative bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {file.file.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file.size)}
                        </span>
                        {getStatusText(file)}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeFile(index)}
                    disabled={file.status === 'completed'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={file.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
      
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

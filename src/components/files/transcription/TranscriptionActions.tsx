
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Download, Pencil, Save, X } from 'lucide-react';

interface TranscriptionActionsProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

const TranscriptionActions: React.FC<TranscriptionActionsProps> = ({
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onCopy,
  onDownload
}) => {
  if (isEditing) {
    return (
      <>
        <Button 
          onClick={onSave}
          size="sm" 
          variant="outline"
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          <span>Сохранить</span>
        </Button>
        
        <Button 
          onClick={onCancel}
          size="sm" 
          variant="outline"
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          <span>Отмена</span>
        </Button>
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={onEdit}
        size="sm" 
        variant="outline"
        className="flex items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
        <span>Редактировать</span>
      </Button>
      
      <Button 
        onClick={onCopy}
        size="sm" 
        variant="outline"
        className="flex items-center gap-1"
      >
        <Copy className="h-4 w-4" />
        <span>Копировать</span>
      </Button>
      
      <Button 
        onClick={onDownload}
        size="sm" 
        variant="outline"
        className="flex items-center gap-1"
      >
        <Download className="h-4 w-4" />
        <span>Скачать</span>
      </Button>
    </>
  );
};

export default TranscriptionActions;

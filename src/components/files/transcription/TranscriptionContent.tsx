import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface TranscriptionContentProps {
  activeTab: string;
  isEditing: boolean;
  editedText: string;
  processedTranscription: string; // This now contains already formatted content
  onEditChange: (value: string) => void;
}

const TranscriptionContent: React.FC<TranscriptionContentProps> = ({
  activeTab,
  isEditing,
  editedText,
  processedTranscription,
  onEditChange
}) => {
  const getContent = () => {
    if (isEditing) {
      return (
        <Textarea 
          value={editedText}
          onChange={(e) => onEditChange(e.target.value)}
          className="min-h-[250px] font-mono text-sm w-full"
        />
      );
    }

    return (
      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed w-full">
        {processedTranscription}
      </div>
    );
  };

  return getContent();
};

export default TranscriptionContent;

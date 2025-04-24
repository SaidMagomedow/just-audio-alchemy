
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { convertToWebVTT, convertToRST, convertToJSON } from '@/utils/transcriptionFormatters';

interface TranscriptionContentProps {
  activeTab: string;
  isEditing: boolean;
  editedText: string;
  processedTranscription: string;
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
    if (activeTab === 'text' && isEditing) {
      return (
        <Textarea 
          value={editedText}
          onChange={(e) => onEditChange(e.target.value)}
          className="min-h-[250px] font-mono text-sm"
        />
      );
    }

    const content = (() => {
      switch (activeTab) {
        case 'webvtt':
          return convertToWebVTT(processedTranscription);
        case 'rst':
          return convertToRST(processedTranscription);
        case 'json':
          return convertToJSON(processedTranscription);
        default:
          return processedTranscription;
      }
    })();

    return (
      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {content}
      </div>
    );
  };

  return (
    <TabsContent value={activeTab} className="w-full">
      {getContent()}
    </TabsContent>
  );
};

export default TranscriptionContent;

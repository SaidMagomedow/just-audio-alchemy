
import React from 'react';
import { TranscribedFile } from './FileList';
import { Message } from './ChatInterface';
import FileHeader from './FileHeader';
import AudioPlayer from './AudioPlayer';
import ChatInterface from './ChatInterface';

interface FileDetailsProps {
  selectedFile: TranscribedFile | null;
  showChat: boolean;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onOpenAssistant: () => void;
  onRemoveNoise: () => void;
  onRemoveMelody: () => void;
  onRemoveVocals: () => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({
  selectedFile,
  showChat,
  messages,
  onSendMessage,
  onOpenAssistant,
  onRemoveNoise,
  onRemoveMelody,
  onRemoveVocals
}) => {
  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-10">
        Выберите файл для прослушивания
      </div>
    );
  }

  return (
    <div className="w-full md:w-2/3 border rounded-lg shadow-sm flex flex-col">
      {showChat ? (
        <>
          <ChatInterface 
            messages={messages}
            onSendMessage={onSendMessage}
            fileName={selectedFile.name}
          />
        </>
      ) : (
        <>
          <FileHeader 
            file={selectedFile}
            onOpenAssistant={onOpenAssistant}
            onRemoveNoise={onRemoveNoise}
            onRemoveMelody={onRemoveMelody}
            onRemoveVocals={onRemoveVocals}
          />
          <AudioPlayer 
            file={selectedFile}
            onOpenAssistant={onOpenAssistant}
            onRemoveNoise={onRemoveNoise}
            onRemoveMelody={onRemoveMelody}
            onRemoveVocals={onRemoveVocals}
          />
        </>
      )}
    </div>
  );
};

export default FileDetails;

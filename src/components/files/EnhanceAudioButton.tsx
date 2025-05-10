import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";

// Интерфейс для пресета улучшения звука
interface AudioEnhancementPreset {
  id: string;
  label: string;
  description: string;
}

// Интерфейс пропсов компонента
interface EnhanceAudioButtonProps {
  onEnhance: (presetId: string) => void;
  disabled?: boolean;
  className?: string;
  status?: 'idle' | 'processing' | 'completed' | 'failed' | 'not started';
  hasImprovedAudio?: boolean;
  localProcessing?: boolean;
}

// Список доступных пресетов
const PRESETS: AudioEnhancementPreset[] = [
  {
    id: "smart_enhancement",
    label: "Умное улучшение",
    description: "Универсальное улучшение качества речи"
  },
  {
    id: "expressive_speech",
    label: "Выразительная речь",
    description: "Делает голос ярче и выделяет высокие частоты."
  },
  {
    id: "clear_speech",
    label: "Ясная речь",
    description: "Подходит для записи голоса в домашних условиях или на диктофон."
  },
  {
    id: "quiet_voice_boost",
    label: "Тихий голос",
    description: "Усиливает и делает более разборчивым слабый голос."
  },{
    id: "lecture_optimization",
    label: "Лекция или Zoom",
    description: "Усиливает речь, удаляет эхо"
  },
  {
    id: "noisy_environment_cleanup",
    label: "Улица или машина",
    description: "Подавляет шум, делает речь четкой"
  },
  {
    id: "video_voice_enhancement",
    label: "Подкаст или интервью",
    description: "Фокус на голосе, мягкое шумоподавление"
  }
];

const EnhanceAudioButton: React.FC<EnhanceAudioButtonProps> = ({
  onEnhance,
  disabled = false,
  className = "",
  status = 'idle',
  hasImprovedAudio = false,
  localProcessing = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AudioEnhancementPreset>(PRESETS[0]);

  const handleSelectPreset = (preset: AudioEnhancementPreset) => {
    setSelectedPreset(preset);
  };

  const handleApplyPreset = () => {
    setOpen(false);
    onEnhance(selectedPreset.id);
  };

  // Если статус completed или есть улучшенное аудио, кнопка должна быть отключена
  const isButtonDisabled = disabled || status === 'processing' || hasImprovedAudio || localProcessing;

  return (
    <div className={`flex flex-col h-[75px] flex-1 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex flex-col items-start gap-0.5 h-auto py-2 w-full justify-between relative overflow-hidden group"
            disabled={isButtonDisabled}
            style={{
              background: "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.25))",
              borderColor: "rgba(139, 92, 246, 0.4)"
            }}
          >
            <div className="flex items-center gap-1.5 w-full justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-600 relative z-10" />
                <span className="relative z-10 font-medium text-sm text-purple-800">
                  {open ? "Выберите пресет" : "Улучшить звук AI"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-purple-600 relative z-10" />
            </div>
            {!open && selectedPreset && (
              <span className="text-xs text-purple-700 pl-6 relative z-10">
                {selectedPreset.label}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup heading="Выберите пресет улучшения">
                {PRESETS.map((preset) => (
                  <CommandItem
                    key={preset.id}
                    onSelect={() => handleSelectPreset(preset)}
                    className="flex items-start py-2 px-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`rounded-full w-4 h-4 flex items-center justify-center ${selectedPreset.id === preset.id ? 'bg-purple-600' : 'border border-gray-300'}`}>
                        {selectedPreset.id === preset.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{preset.label}</span>
                        <span className="text-xs text-gray-500">{preset.description}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t">
              <Button 
                onClick={handleApplyPreset} 
                className="w-full"
                variant="default"
              >
                Применить
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="h-6 flex justify-center items-center mt-1">
        {(localProcessing || status === 'processing') ? (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Обработка...
          </span>
        ) : (hasImprovedAudio || status === 'completed') ? (
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Готово
          </span>
        ) : status === 'failed' ? (
          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
            Ошибка
          </span>
        ) : (
          <span className="text-xs text-gray-500">
          </span>
        )}
      </div>
    </div>
  );
};

export default EnhanceAudioButton; 
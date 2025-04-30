import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose, feature }) => {
  const navigate = useNavigate();
  
  const handleUpgrade = () => {
    navigate('/pricing'); // Перенаправляем на страницу с тарифами
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Расширьте возможности</DialogTitle>
          <DialogDescription>
            Функция <strong>{feature}</strong> доступна только в расширенной подписке.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Улучшите вашу подписку, чтобы получить доступ к дополнительным возможностям, включая:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Скачивание расшифровок в различных форматах</li>
            <li>Удаление шумов и мелодий из аудио</li>
            <li>Расширенные возможности работы с GPT</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleUpgrade} className="bg-[#F97316] hover:bg-orange-600">
            Улучшить подписку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal; 
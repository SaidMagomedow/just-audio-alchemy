import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}

const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  action = "выполнить это действие"
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <Lock className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center">Требуется авторизация</DialogTitle>
          <DialogDescription className="text-center">
            Чтобы {action}, необходимо авторизоваться или зарегистрироваться в системе.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center sm:space-x-2 gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleLogin} 
            style={{
              backgroundColor: 'black',
              color: 'white'
            }}
            className={cn(
              "transition-colors duration-200",
              "hover:!bg-accent-orange hover:!text-white"
            )}
          >
            Войти в аккаунт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal; 
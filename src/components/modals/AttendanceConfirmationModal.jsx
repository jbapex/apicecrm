import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

const AttendanceConfirmationModal = ({ isOpen, onOpenChange, onConfirm, type = 'attendance' }) => {
  if (!isOpen) return null;

  const content = {
    attendance: {
      title: "Confirmar Comparecimento",
      description: "O lead compareceu ao agendamento? Se você mudou o status por engano, cancele.",
      confirmText: "Sim, Compareceu",
      denyText: "Não Compareceu",
      wrongStatusText: "Mudei o status por engano"
    },
    scheduling: {
      title: "Confirmar Agendamento",
      description: "Você está movendo este lead para um status de agendamento. Deseja registrar a data e hora do agendamento agora?",
      confirmText: "Sim, Agendar Agora",
      denyText: "Não Agendar",
      wrongStatusText: "Mudei o status por engano"
    },
    rescheduling: {
      title: "Confirmar Reagendamento",
      description: "Este lead já possui uma data de agendamento. Deseja substituir a data antiga pela data e hora atuais?",
      confirmText: "Sim, Substituir",
      denyText: "Não, Manter Antigo",
      wrongStatusText: "Cancelar Alteração"
    },
    reattendance: {
      title: "Confirmar Novo Comparecimento",
      description: "Este lead já possui um registro de comparecimento. Deseja prosseguir e registrar este novo evento?",
      confirmText: "Sim, Registrar Novo",
      denyText: "Não, Manter Antigo",
      wrongStatusText: "Cancelar Alteração"
    }
  };

  const currentContent = content[type] || content.attendance;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{currentContent.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentContent.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="success" onClick={() => onConfirm('attended')}>{currentContent.confirmText}</Button>
          <Button variant="destructive" onClick={() => onConfirm('no-show')}>{currentContent.denyText}</Button>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={() => onConfirm('wrong-status')}>{currentContent.wrongStatusText}</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AttendanceConfirmationModal;
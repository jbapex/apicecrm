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
import { AlertTriangle } from 'lucide-react';

const DuplicateLeadDialog = ({ isOpen, onCancel, onConfirm, existingLead, newLeadData }) => {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="text-yellow-500 mr-2" />
            Lead Duplicado Encontrado
          </AlertDialogTitle>
          <AlertDialogDescription>
            Já existe um lead com o número de telefone <strong>{existingLead.whatsapp}</strong>.
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
              <p><strong>Nome Existente:</strong> {existingLead.nome}</p>
              <p><strong>Status Existente:</strong> {existingLead.status}</p>
              <p className="mt-2"><strong>Novas Informações:</strong></p>
              <p><strong>Nome:</strong> {newLeadData.nome}</p>
              <p><strong>Status:</strong> {newLeadData.status}</p>
            </div>
            <p className="mt-4">Deseja atualizar as informações do lead existente com os novos dados?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Ignorar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Sim, atualizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DuplicateLeadDialog;
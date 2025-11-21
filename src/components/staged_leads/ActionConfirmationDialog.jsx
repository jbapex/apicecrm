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

const ActionConfirmationDialog = ({ open, onOpenChange, onConfirm, onCancel, actionDetails }) => {
    if (!actionDetails) return null;

    const isCustomDialog = actionDetails.customTitle;

    const actionText = actionDetails.type === 'import' ? 'importar' : 'ignorar';
    const title = isCustomDialog ? actionDetails.customTitle : `Confirmar Ação`;
    const description = isCustomDialog ? actionDetails.customDescription : `Você tem certeza que deseja ${actionText} ${actionDetails.count} lead(s) selecionado(s)?`;
    
    const handleConfirm = () => {
        if(onConfirm) onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" onClick={handleCancel}>
                            {actionDetails.cancelText || 'Cancelar'}
                        </Button>
                    </AlertDialogCancel>
                     <AlertDialogAction asChild>
                        <Button
                            onClick={handleConfirm}
                            className={actionDetails.type === 'ignore' && !isCustomDialog ? 'bg-red-500 hover:bg-red-600' : ''}
                        >
                           {actionDetails.confirmText || `Sim, ${actionText}`}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ActionConfirmationDialog;
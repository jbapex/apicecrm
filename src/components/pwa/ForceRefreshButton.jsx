import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ForceRefreshButton = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    toast({
      title: "Atualizando o sistema...",
      description: "Limpando cache e recarregando para a versão mais recente. Isso pode levar um momento.",
    });

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));

      setTimeout(() => {
        window.location.reload(true);
      }, 1500);

    } catch (error) {
      console.error('Falha ao forçar a atualização:', error);
      toast({
        title: "Erro na atualização",
        description: "Não foi possível limpar o cache. Tente limpar o cache do seu navegador manualmente.",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2">
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Atualizar Sistema</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Atualização?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso limpará o cache do aplicativo e recarregará a página para garantir que você esteja usando a versão mais recente. Ações não salvas podem ser perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleForceRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Atualizando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ForceRefreshButton;
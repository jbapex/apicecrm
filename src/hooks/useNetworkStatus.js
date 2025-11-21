import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { toast } = useToast();
    const toastRef = useRef(null);

    const showOfflineToast = useCallback(() => {
        if (toastRef.current) {
            toastRef.current.dismiss();
        }
        toastRef.current = toast({
            variant: "destructive",
            title: "Sem conexão com a internet",
            description: "Você está offline. Verificando a conexão...",
            duration: Infinity,
        });
    }, [toast]);

    const showOnlineToast = useCallback(() => {
        toast({
            title: "Conexão reestabelecida!",
            description: "Você está online novamente.",
            duration: 3000,
        });
    }, [toast]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (toastRef.current) {
                toastRef.current.dismiss();
                toastRef.current = null;
            }
            showOnlineToast();
        };

        const handleOffline = () => {
            setIsOnline(false);
            showOfflineToast();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (toastRef.current) {
                toastRef.current.dismiss();
            }
        };
    }, [showOnlineToast, showOfflineToast]);

    return isOnline;
};
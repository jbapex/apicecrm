/*
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered.');
    },
    onRegisterError(error) {
      console.error('Error during service worker registration:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-[100]"
        >
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white">
                  {needRefresh ? 'Nova versão disponível!' : 'App pronto para uso offline!'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {needRefresh
                    ? 'Uma nova versão do aplicativo está pronta. Atualize para ter acesso aos recursos mais recentes.'
                    : 'O aplicativo foi instalado e está pronto para funcionar offline.'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              {needRefresh && (
                <Button onClick={handleUpdate} className="btn-primary">
                  Atualizar
                </Button>
              )}
              <Button variant="outline" onClick={close}>
                Fechar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PwaUpdater;
*/
import React from 'react';

function PwaUpdater() {
  // PWA functionality is temporarily disabled due to a configuration lock.
  return null;
}

export default PwaUpdater;
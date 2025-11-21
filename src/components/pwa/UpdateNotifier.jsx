import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

const UpdateNotifier = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (isChecking) return;
      setIsChecking(true);
      try {
        const response = await fetch('/version.json?t=' + new Date().getTime(), {
          cache: 'no-store',
        });
        const serverVersionData = await response.json();
        const currentVersion = document.documentElement.getAttribute('data-version') || window.APP_VERSION;

        if (currentVersion && serverVersionData.version !== currentVersion) {
          setIsUpdateAvailable(true);
        } else if (!currentVersion) {
            document.documentElement.setAttribute('data-version', serverVersionData.version);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkForUpdates();
    const intervalId = setInterval(checkForUpdates, 60 * 1000); // Check every 60 seconds
    return () => clearInterval(intervalId);
  }, [isChecking]);

  const handleUpdate = () => {
    window.location.reload(true);
  };

  const close = () => {
    setIsUpdateAvailable(false);
  };

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <AnimatePresence>
      {isUpdateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white">
                  Nova versão disponível!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Uma nova versão do aplicativo está pronta. Atualize para ter acesso aos recursos mais recentes.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button onClick={handleUpdate} className="btn-primary">
                Atualizar
              </Button>
              <Button variant="outline" onClick={close}>
                Agora não
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotifier;
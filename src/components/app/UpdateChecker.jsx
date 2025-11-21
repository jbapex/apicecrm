import React, { useState, useEffect, useCallback } from 'react';
import UpdateNotifier from '@/components/pwa/UpdateNotifier';

const UpdateChecker = () => {
  const [isUpdateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);

  const fetchVersion = useCallback(async () => {
    try {
      const response = await fetch(`/version.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        console.error('Failed to fetch version.json:', response.statusText);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching version.json:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const getInitialVersion = async () => {
      const versionData = await fetchVersion();
      if (versionData) {
        setCurrentVersion(versionData.version);
      }
    };
    getInitialVersion();
  }, [fetchVersion]);

  useEffect(() => {
    if (!currentVersion) return;

    const checkForUpdates = async () => {
      const latestVersionData = await fetchVersion();
      if (latestVersionData && latestVersionData.version !== currentVersion) {
        setUpdateAvailable(true);
        if (intervalId) clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(checkForUpdates, 300000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, [currentVersion, fetchVersion]);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (isUpdateAvailable) {
    return <UpdateNotifier onUpdate={handleUpdate} />;
  }

  return null;
};

export default UpdateChecker;
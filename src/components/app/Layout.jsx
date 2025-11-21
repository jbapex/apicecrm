import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/app/Sidebar';
import Header from '@/components/app/Header';
import MobileBottomNav from '@/components/app/MobileBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Layout = ({ children, activeTab, setActiveTab, setShowAddLead, stagedLeadsCount }) => {
  const { signOut } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {!isMobile && (
        <motion.div
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          animate={{ width: isSidebarExpanded ? '256px' : '80px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative"
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isExpanded={isSidebarExpanded}
            stagedLeadsCount={stagedLeadsCount}
            onLogout={signOut}
          />
        </motion.div>
      )}
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
        <Header
          activeTab={activeTab}
          setMobileSidebarOpen={setMobileSidebarOpen}
          setShowAddLead={setShowAddLead}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {isMobile && (
        <MobileBottomNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stagedLeadsCount={stagedLeadsCount}
        />
      )}
    </div>
  );
};

export default Layout;
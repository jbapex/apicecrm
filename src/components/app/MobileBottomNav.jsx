import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Inbox,
  MoreVertical,
  Calendar,
  BarChart2,
  Clock,
  Send,
  Webhook,
  Settings,
  LogOut,
  Workflow,
  AreaChart
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const NavItem = ({ icon, label, active, onClick, count, specialColorClass }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
      active ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
    } ${specialColorClass || ''}`}
  >
    {icon}
    <span className="text-xs font-medium mt-1">{label}</span>
    {count > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 right-3 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
      >
        {count}
      </motion.span>
    )}
  </button>
);

const MoreMenu = ({ setActiveTab, onClose, signOut }) => {
  const menuItems = [
    { id: 'agendamentos', label: 'Agendamentos', icon: <Calendar className="w-5 h-5" /> },
    { id: 'week', label: 'Análise Semanal', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <AreaChart className="w-5 h-5" /> },
    { id: 'follow-up', label: 'Follow-up', icon: <Clock className="w-5 h-5" /> },
    { id: 'follow-up-flow', label: 'Flows', icon: <Workflow className="w-5 h-5" /> },
    { id: 'apicebot', label: 'ÁpiceBot', icon: <Send className="w-5 h-5" /> },
    { id: 'webhooks', label: 'Webhook', icon: <Webhook className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed bottom-[4.5rem] left-0 right-0 bg-white dark:bg-gray-800 p-4 rounded-t-2xl shadow-lg z-50"
      >
        <div className="grid grid-cols-4 gap-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-300 space-y-1"
            >
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                {item.icon}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
           <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex flex-col items-center justify-center text-red-500 space-y-1"
            >
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-xs">Sair</span>
            </button>
        </div>
      </motion.div>
    </>
  );
};


const MobileBottomNav = ({ activeTab, setActiveTab, stagedLeadsCount }) => {
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'leads', label: 'Leads', icon: <Users className="w-6 h-6" /> },
    { id: 'staged-leads', label: 'Entrada', icon: <Inbox className="w-6 h-6" />, count: stagedLeadsCount, specialColorClass: 'text-orange-500' },
  ];

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-2 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 grid grid-cols-4 rounded-lg mx-2"
      >
        {mainNavItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            count={item.count}
            specialColorClass={item.specialColorClass}
          />
        ))}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            isMoreMenuOpen ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <MoreVertical className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Mais</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {isMoreMenuOpen && (
          <MoreMenu setActiveTab={setActiveTab} onClose={() => setMoreMenuOpen(false)} signOut={signOut}/>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
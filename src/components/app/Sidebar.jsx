import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Users, Calendar, FolderClock, Settings, Bot, ListChecks, FileText, Anchor, MessageSquare, Workflow, Inbox, FileBarChart as FileChart } from 'lucide-react';
import Logo from '@/components/app/Logo';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
const Sidebar = ({
  activeTab,
  setActiveTab,
  isExpanded,
  stagedLeadsCount,
  onLogout
}) => {
  const {
    user
  } = useAuth();
  const navItems = [{
    id: 'dashboard',
    icon: BarChart2,
    label: 'Dashboard'
  }, {
    id: 'leads',
    icon: Users,
    label: 'Gestão de Leads'
  }, {
    id: 'agendamentos',
    icon: Calendar,
    label: 'Agendamentos'
  }, {
    id: 'week',
    icon: FolderClock,
    label: 'Análise Semanal'
  }, {
    id: 'relatorios',
    icon: FileChart,
    label: 'Relatórios'
  }, {
    id: 'follow-up',
    icon: ListChecks,
    label: 'Follow-up',
    subItems: [{
      id: 'follow-up-flow',
      icon: Workflow,
      label: 'Automações'
    }, {
      id: 'follow-up-logs',
      icon: FileText,
      label: 'Logs'
    }]
  }, {
    id: 'integrations',
    icon: Anchor,
    label: 'Integrações',
    subItems: [{
      id: 'apicebot',
      icon: Bot,
      label: 'ÁpiceBot'
    }, {
      id: 'webhooks',
      icon: MessageSquare,
      label: 'Webhook Genérico'
    }, {
      id: 'tintim-webhook',
      icon: MessageSquare,
      label: 'Webhook Tintim'
    }, {
      id: 'tintim-leads',
      icon: Inbox,
      label: 'Leads Tintim'
    }]
  }];
  const bottomNavItems = [{
    id: 'settings',
    icon: Settings,
    label: 'Configurações'
  }];
  const handleNavigation = id => {
    setActiveTab(id);
  };
  const NavItem = ({
    item,
    isSubItem = false
  }) => {
    const isActive = activeTab === item.id || item.subItems && item.subItems.some(sub => sub.id === activeTab);
    return <div className={`${isSubItem ? 'pl-8' : ''}`}>
        <div onClick={() => handleNavigation(item.id)} className={`
            flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200
            ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}
          `}>
          <item.icon className={`h-5 w-5`} />
          <AnimatePresence>
            {isExpanded && <motion.span initial={{
            opacity: 0,
            x: -10
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -10
          }} transition={{
            duration: 0.2,
            delay: 0.1
          }} className="ml-4 font-medium whitespace-nowrap">
                {item.label}
              </motion.span>}
          </AnimatePresence>
        </div>
        {isExpanded && isActive && item.subItems && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} className="overflow-hidden">
            {item.subItems.map(subItem => <NavItem key={subItem.id} item={subItem} isSubItem={true} />)}
          </motion.div>}
      </div>;
  };
  const StagedLeadsNavItem = () => <div onClick={() => handleNavigation('staged-leads')} className={`
        flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200
        ${activeTab === 'staged-leads' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'text-orange-500 dark:text-orange-400 hover:bg-orange-500/10'}
      `}>
      <div className="relative">
        <Inbox className="h-5 w-5" />
        {stagedLeadsCount > 0 && <motion.div initial={{
        scale: 0
      }} animate={{
        scale: 1
      }} className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {stagedLeadsCount}
          </motion.div>}
      </div>
      <AnimatePresence>
        {isExpanded && <motion.span initial={{
        opacity: 0,
        x: -10
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -10
      }} transition={{
        duration: 0.2,
        delay: 0.1
      }} className="ml-4 font-medium whitespace-nowrap">
            Caixa de Entrada
          </motion.span>}
      </AnimatePresence>
    </div>;
  const getInitials = email => {
    if (!email) return '?';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
  };
  return <aside className="h-full bg-white dark:bg-gray-800 flex flex-col p-4 shadow-2xl transition-all duration-300">
      <div className="flex items-center mb-8" style={{
      paddingLeft: isExpanded ? '0.75rem' : '0'
    }}>
         <Logo isExpanded={isExpanded} />
      </div>

      <nav className="flex-grow">
        <StagedLeadsNavItem />
        {navItems.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      <div>
        {bottomNavItems.map(item => <NavItem key={item.id} item={item} />)}
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
           <div className="flex items-center p-2">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
              <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
             <AnimatePresence>
              {isExpanded && <motion.div initial={{
              opacity: 0,
              x: -10
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -10
            }} transition={{
              duration: 0.2,
              delay: 0.1
            }} className="ml-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">{user.email}</p>
                  <Button variant="link" className="p-0 h-auto text-xs text-red-500" onClick={onLogout}>
                    Sair
                  </Button>
                </motion.div>}
            </AnimatePresence>
           </div>
           <AnimatePresence>
              {isExpanded && <motion.p initial={{
            opacity: 0,
            x: -10
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -10
          }} transition={{
            duration: 0.2,
            delay: 0.2
          }} className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 whitespace-nowrap">© 2025 JB APEX 2.2.0</motion.p>}
            </AnimatePresence>
        </div>
      </div>
    </aside>;
};
export default Sidebar;
import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';


const Header = ({ activeTab, setMobileSidebarOpen, setShowAddLead }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'leads': return 'Gestão de Leads';
      case 'agendamentos': return 'Agendamentos';
      case 'week': return 'Análise Semanal';
      case 'lancamento-rapido': return 'Lançamento Rápido';
      case 'follow-up': return 'Follow-up';
      case 'follow-up-flow': return 'Flow de Follow-up';
      case 'staged-leads': return 'Caixa de Entrada';
      case 'apicebot': return 'Integração ÁpiceBot';
      case 'webhooks': return 'Webhook Genérico';
      case 'settings': return 'Configurações';
      case 'inbox': return 'Inbox';
      default: return 'Dashboard';
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0 z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          {isMobile ? null : (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{getTitle()}</h1>
          )}
        </div>
        
        {isMobile && <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTitle()}</h1>}


        <div className="flex items-center gap-2">
           {isMobile && (
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="icon"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="sr-only">Atualizar Página</span>
            </Button>
          )}
          <Button
            onClick={() => setShowAddLead(true)}
            className="btn-primary flex items-center"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Lead</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
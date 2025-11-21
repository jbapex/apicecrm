import React from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery.js';
import FollowUpFilters from '@/components/followup/FollowUpFilters';
import FollowUpTable from '@/components/followup/FollowUpTable';
import FollowUpMobileList from '@/components/followup/FollowUpMobileList';
import TaskChanger from '@/components/followup/TaskChanger';
import { Button } from '@/components/ui/button';
import { Users, ListChecks } from 'lucide-react';
import { useFollowUp } from '@/hooks/useFollowUp.js';
import FollowUpModals from '@/components/followup/FollowUpModals';
import { useSettings } from '@/contexts/SettingsContext.jsx';

const FollowUpContent = ({ onUpdateLead }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { settings, getStatusText } = useSettings();
  
  const {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    tasks,
    fetchTasks,
    displayedLeads,
    loading,
    handleUpdateLeadLocally,
    activeFlowsByLead,
    modalType,
    selectedLead,
    isChangingFlow,
    flowActions,
    handleStartFlowManual,
    openModal,
    closeModal,
  } = useFollowUp();

  const handleUpdate = async (leadId, updates) => {
    const { data, error } = await onUpdateLead(leadId, updates);
    if (!error) {
      handleUpdateLeadLocally(leadId, updates);
    }
  };

  const renderLeads = () => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      );
    }

    if (displayedLeads.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          {viewMode === 'tasks' ? 'Nenhuma tarefa pendente encontrada.' : 'Nenhum lead encontrado com os filtros selecionados.'}
        </div>
      );
    }

    if (isMobile) {
      return (
        <FollowUpMobileList
          leads={displayedLeads}
          onUpdateLead={handleUpdate}
          statuses={settings?.statuses || []}
          getStatusText={getStatusText}
          openModal={openModal}
          activeFlowsByLead={activeFlowsByLead}
          flowActions={flowActions}
          tasks={tasks}
          TaskChangerComponent={(props) => <TaskChanger {...props} onUpdateLead={handleUpdate}/>}
        />
      );
    }

    return (
      <FollowUpTable
        leads={displayedLeads}
        onUpdateLead={handleUpdate}
        statuses={settings?.statuses || []}
        getStatusText={getStatusText}
        openModal={openModal}
        activeFlowsByLead={activeFlowsByLead}
        flowActions={flowActions}
        tasks={tasks}
      />
    );
  };

  return (
    <>
      <motion.div
        key="follow-up"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className='flex items-center gap-2'>
                <Button 
                    variant={viewMode === 'leads' ? 'default' : 'outline'} 
                    onClick={() => setViewMode('leads')}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Todos os Leads
                </Button>
                <Button 
                    variant={viewMode === 'tasks' ? 'default' : 'outline'} 
                    onClick={() => setViewMode('tasks')}
                >
                    <ListChecks className="w-4 h-4 mr-2" />
                    Minhas Tarefas
                </Button>
            </div>
        </div>
        
        <FollowUpFilters
          filters={filters}
          setFilters={setFilters}
          statuses={settings?.statuses || []}
          getStatusText={getStatusText}
          tasks={tasks}
          onTasksUpdate={fetchTasks}
        />

        <div className="bg-white rounded-lg card-shadow overflow-hidden">
          {renderLeads()}
        </div>
      </motion.div>
      <FollowUpModals
        modalType={modalType}
        selectedLead={selectedLead}
        isChangingFlow={isChangingFlow}
        closeModal={closeModal}
        onStartFlow={handleStartFlowManual}
      />
    </>
  );
};

export default FollowUpContent;
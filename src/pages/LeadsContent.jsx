import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeadsHeader from '@/components/leads/LeadsHeader';
import LeadsTable from '@/components/leads/LeadsTable';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import LeadCard from '@/components/leads/LeadCard';
import { Info, Loader2 } from 'lucide-react';
import EditLeadModal from '@/components/modals/EditLeadModal';
import NewLeadRow from '@/components/leads/NewLeadRow';
import KanbanBoard from '@/components/leads/KanbanBoard';
import DuplicateLeadDialog from '@/components/leads/DuplicateLeadDialog';

const LeadsContent = ({
  leadsHook,
  onShowComments,
  onShowLeadDetail,
  onAddNewLead
}) => {
  const {
    filteredLeads: leads,
    loading,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    handleUpdateLead: onUpdateLead,
    handleDeleteLead: onDeleteLead,
    handleBulkDeleteLeads: onBulkDelete,
    exportData: onExport,
    getStatusIcon,
    getStatusText,
    handleAddLead: onAddLead,
    updateExistingLead,
    refetchLeads,
    loadMoreLeads,
    hasMore,
  } = leadsHook;

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [editingLead, setEditingLead] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [duplicateLeadInfo, setDuplicateLeadInfo] = useState(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const observer = useRef();
  const lastLeadElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreLeads();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreLeads]);

  useEffect(() => {
    if (isMobile) {
      setViewMode('list'); // 'list' will render cards on mobile
    }
  }, [isMobile]);

  useEffect(() => {
    setSelectedLeads([]);
  }, [leads, filters, searchTerm, viewMode]);

  const handleAddLeadWithDuplicateCheck = async (leadData) => {
    const result = await onAddLead(leadData);
    if (result.duplicate) {
      setDuplicateLeadInfo({
        existingLead: result.existingLead,
        newLeadData: leadData,
      });
    }
  };

  const confirmUpdateDuplicate = () => {
    if (duplicateLeadInfo) {
      updateExistingLead(duplicateLeadInfo.existingLead, duplicateLeadInfo.newLeadData);
      setDuplicateLeadInfo(null);
    }
  };

  const cancelUpdateDuplicate = () => {
    setDuplicateLeadInfo(null);
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
  };

  const handleSaveEdit = (updatedLead) => {
    onUpdateLead(updatedLead.id, updatedLead);
    setEditingLead(null);
  };

  const handleSelectOne = (leadId, checked) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const renderNoLeads = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg card-shadow text-center p-12">
      <Info className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Nenhum lead encontrado</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Parece que não há leads com os filtros aplicados.
      </p>
    </div>
  );

  const renderContent = () => {
    if (loading && leads.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        </div>
      );
    }
  
    if (viewMode === 'kanban' && !isMobile) {
      return <KanbanBoard leads={leads} onUpdateLead={onUpdateLead} onShowLeadDetail={onShowLeadDetail} />;
    }
  
    if (leads.length === 0 && !loading) {
      return renderNoLeads();
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          <AnimatePresence>
            {leads.map((lead, index) => (
              <div ref={index === leads.length - 1 ? lastLeadElementRef : null} key={lead.id}>
                <LeadCard
                  lead={lead}
                  selected={selectedLeads.includes(lead.id)}
                  onSelect={(checked) => handleSelectOne(lead.id, checked)}
                  onEdit={handleEdit}
                  onDelete={onDeleteLead}
                  onShowDetail={onShowLeadDetail}
                  getStatusIcon={getStatusIcon}
                  getStatusText={getStatusText}
                  onUpdateLead={onUpdateLead}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      );
    }
  
    return (
      <>
        <LeadsTable
          leads={leads}
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
          onUpdateLead={onUpdateLead}
          onDeleteLead={onDeleteLead}
          onAddLead={handleAddLeadWithDuplicateCheck}
          getStatusIcon={getStatusIcon}
          getStatusText={getStatusText}
          onShowComments={onShowComments}
          onShowLeadDetail={onShowLeadDetail}
          lastLeadElementRef={lastLeadElementRef}
        />
        {loading && leads.length > 0 && (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-2">Carregando mais leads...</span>
          </div>
        )}
      </>
    );
  };
  
  return (
    <>
      <motion.div
        key="leads"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <LeadsHeader
          filters={filters}
          setFilters={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onExport={onExport}
          selectedLeads={selectedLeads}
          onBulkDelete={onBulkDelete}
          onAddNewLead={onAddNewLead}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        {renderContent()}
      </motion.div>

      <AnimatePresence>
        {editingLead && (
          <EditLeadModal
            lead={editingLead}
            onClose={() => setEditingLead(null)}
            onSave={handleSaveEdit}
          />
        )}
      </AnimatePresence>

      <DuplicateLeadDialog
        isOpen={!!duplicateLeadInfo}
        onCancel={cancelUpdateDuplicate}
        onConfirm={confirmUpdateDuplicate}
        existingLead={duplicateLeadInfo?.existingLead}
        newLeadData={duplicateLeadInfo?.newLeadData}
      />
    </>
  );
};

export default LeadsContent;
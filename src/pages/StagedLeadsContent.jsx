import React from 'react';
import { motion } from 'framer-motion';
import { useStagedLeads } from '@/hooks/useStagedLeads.js';
import { useMediaQuery } from '@/hooks/useMediaQuery.js';
import { useSettings } from '@/contexts/SettingsContext.jsx';
import StagedLeadsHeader from '@/components/staged_leads/StagedLeadsHeader';
import StagedLeadsTable from '@/components/staged_leads/StagedLeadsTable';
import StagedLeadsMobileList from '@/components/staged_leads/StagedLeadsMobileList';
import NoStagedLeads from '@/components/staged_leads/NoStagedLeads';
import BulkActionsBar from '@/components/staged_leads/BulkActionsBar';
import ConversationHistoryModal from '@/components/modals/ConversationHistoryModal';
import { Loader2 } from 'lucide-react';
import ActionConfirmationDialog from '@/components/staged_leads/ActionConfirmationDialog';

const StagedLeadsContent = () => {
    const {
        leads,
        loading,
        searchTerm,
        setSearchTerm,
        setDateRange,
        selectedLeads,
        setSelectedLeads,
        updatingLeadId,
        handleSelectLead,
        handleSelectAll,
        handleUpdateLeadField,
        handleImportLead,
        handleDeleteLead,
        handleBulkImport,
        handleBulkDelete,
        conversationModal,
        setConversationModal,
        confirmationDialog,
        setConfirmationDialog,
        confirmAction,
        fetchStagedLeads,
    } = useStagedLeads();
    
    const { settings, loading: settingsLoading } = useSettings();
    const isMobile = useMediaQuery('(max-width: 767px)');

    const renderContent = () => {
        if (loading || settingsLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                </div>
            );
        }

        if (!leads || leads.length === 0) {
            return <NoStagedLeads onRefresh={fetchStagedLeads} searchTerm={searchTerm} />;
        }

        if (isMobile) {
            return (
                <StagedLeadsMobileList
                    leads={leads}
                    selectedLeads={selectedLeads}
                    onSelectLead={handleSelectLead}
                    onUpdateLeadField={handleUpdateLeadField}
                    onImportLead={handleImportLead}
                    onDeleteLead={handleDeleteLead}
                    onShowConversation={(whatsapp) => setConversationModal({ isOpen: true, whatsappNumber: whatsapp })}
                    updatingLeadId={updatingLeadId}
                    settings={settings}
                />
            );
        }

        return (
            <StagedLeadsTable
                leads={leads}
                selectedLeads={selectedLeads}
                onSelectAll={handleSelectAll}
                onSelect={handleSelectLead}
                onUpdate={handleUpdateLeadField}
                onImport={handleImportLead}
                onDelete={handleDeleteLead}
                updatingLeadId={updatingLeadId}
                settings={settings}
            />
        );
    };

    return (
        <>
            <motion.div
                key="staged-leads"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
            >
                <StagedLeadsHeader
                    loading={loading || settingsLoading}
                    onRefresh={fetchStagedLeads}
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    onDateChange={setDateRange}
                    leadsCount={leads.length}
                />
                
                {renderContent()}

                <BulkActionsBar
                    selectedCount={selectedLeads.length}
                    isAllSelected={leads.length > 0 && selectedLeads.length === leads.length}
                    onSelectAll={handleSelectAll}
                    onAction={(action) => {
                        if (action === 'import') handleBulkImport();
                        if (action === 'ignore') handleBulkDelete();
                    }}
                />
            </motion.div>

            {conversationModal.isOpen && (
                <ConversationHistoryModal
                    isOpen={conversationModal.isOpen}
                    onClose={() => setConversationModal({ isOpen: false, whatsappNumber: null })}
                    whatsappNumber={conversationModal.whatsappNumber}
                />
            )}

            {confirmationDialog.action && (
                <ActionConfirmationDialog
                    isOpen={!!confirmationDialog.action}
                    onClose={() => setConfirmationDialog({ action: null, leadIds: [] })}
                    onConfirm={confirmAction}
                    action={confirmationDialog.action}
                    count={confirmationDialog.leadIds.length}
                />
            )}
        </>
    );
};

export default StagedLeadsContent;
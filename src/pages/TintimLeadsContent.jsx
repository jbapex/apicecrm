import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Inbox } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ConversationHistoryModal from '@/components/modals/ConversationHistoryModal';
import EditLeadModal from '@/components/modals/EditLeadModal';
import TintimLeadsHeader from '@/components/tintim/TintimLeadsHeader';
import TintimTableRow from '@/components/tintim/TintimTableRow';
import { useTintimLeads } from '@/hooks/useTintimLeads';
import { useLeads } from '@/hooks/useLeads.jsx';

const TintimLeadsContent = () => {
    const { toast } = useToast();
    const { handleUpdateLead, getStatusText } = useLeads();
    
    const [showConversationModal, setShowConversationModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedPhone, setSelectedPhone] = useState(null);

    const {
        loading,
        actionInProgress,
        filteredEvents,
        sourceStats,
        filters,
        selectedEvents,
        numToConsolidate,
        numToCreate,
        handleFilterChange,
        handleSelectEvent,
        handleSelectAll,
        handleConsolidateLead,
        handleCreateLead,
        handleDeleteEvent,
        handleBulkConsolidate,
        handleBulkCreate,
        fetchEventsAndLeads,
        setExistingLeads,
        findExistingLead
    } = useTintimLeads();

    const handleShowConversation = (e, phone) => {
        e.stopPropagation();
        setSelectedPhone(phone);
        setShowConversationModal(true);
    };

    const handleShowEditModal = (e, event) => {
        e.stopPropagation();
        const lead = findExistingLead(event.parsed.phone);
        if (lead) {
            setSelectedLead(lead);
            setShowEditModal(true);
        }
    };

    const handleSaveLead = async (updatedData) => {
        if (!selectedLead) return;
        const updatedLead = await handleUpdateLead(selectedLead.id, updatedData);
        if (updatedLead) {
            setExistingLeads(prev => new Map(prev).set(updatedLead.whatsapp, updatedLead));
            setShowEditModal(false);
            setSelectedLead(null);
            toast({ title: 'Lead Atualizado!', description: 'As informações do lead foram salvas.' });
        }
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <TintimLeadsHeader
                    numToCreate={numToCreate}
                    numToConsolidate={numToConsolidate}
                    actionInProgress={actionInProgress}
                    loading={loading}
                    onBulkCreate={handleBulkCreate}
                    onBulkConsolidate={handleBulkConsolidate}
                    onRefresh={fetchEventsAndLeads}
                    sourceStats={sourceStats}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Eventos Recebidos</CardTitle>
                        <CardDescription>{loading ? 'Carregando eventos...' : `Mostrando ${filteredEvents.length} contatos únicos.`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div> :
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0} /></TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Origem</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead>Campanha</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {filteredEvents.length > 0 ? filteredEvents.map(event => (
                                            <TintimTableRow
                                                key={event.id}
                                                event={event}
                                                actionInProgress={actionInProgress}
                                                selectedEvents={selectedEvents}
                                                onSelectEvent={handleSelectEvent}
                                                onShowConversation={handleShowConversation}
                                                onShowEditModal={handleShowEditModal}
                                                onConsolidateLead={handleConsolidateLead}
                                                onCreateLead={handleCreateLead}
                                                onDeleteEvent={handleDeleteEvent}
                                                getStatusText={getStatusText}
                                            />
                                        )) : <TableRow><TableCell colSpan={8} className="h-24 text-center"><Inbox className="h-8 w-8 mx-auto text-gray-400" /><p className="mt-2 text-gray-500">Nenhum evento do Tintim para os filtros aplicados.</p></TableCell></TableRow>}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>}
                    </CardContent>
                </Card>
            </div>
            {showConversationModal && <ConversationHistoryModal isOpen={showConversationModal} onClose={() => setShowConversationModal(false)} phone={selectedPhone} />}
            {showEditModal && selectedLead && (
                <EditLeadModal
                    lead={selectedLead}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedLead(null);
                    }}
                    onSave={handleSaveLead}
                />
            )}
        </>
    );
};

export default TintimLeadsContent;
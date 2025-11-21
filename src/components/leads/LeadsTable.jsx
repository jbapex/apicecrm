import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import EditableLeadRow from './EditableLeadRow';
import DisplayLeadRow from './DisplayLeadRow';
import NewLeadRow from './NewLeadRow';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

const LeadsTable = ({
  leads,
  selectedLeads,
  setSelectedLeads,
  onUpdateLead,
  onDeleteLead,
  onAddLead,
  getStatusIcon,
  getStatusText,
  onShowComments,
  onShowLeadDetail,
  lastLeadElementRef,
}) => {
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [leadIdToDelete, setLeadIdToDelete] = useState(null);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectOne = (leadId, checked) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleDeleteConfirmation = () => {
    if (leadIdToDelete) {
      onDeleteLead(leadIdToDelete);
      setLeadIdToDelete(null);
    }
  };

  const handleStartEdit = (lead) => {
    setEditingLeadId(lead.id);
  };

  const handleCancelEdit = () => {
    setEditingLeadId(null);
  };

  const handleSaveEdit = (leadData) => {
    onUpdateLead(leadData.id, leadData);
    setEditingLeadId(null);
  };
  
  const leadToDelete = useMemo(() => {
    if (!leadIdToDelete) return null;
    return leads.find(l => l.id === leadIdToDelete);
  }, [leadIdToDelete, leads]);


  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lead</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Contato</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Fonte</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Agendamento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Vendedor</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Produto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Valor</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <NewLeadRow onAddLead={onAddLead} />
              <AnimatePresence>
                {leads.map((lead, index) => {
                  const isLastElement = index === leads.length - 1;
                  return (
                    <motion.tr
                      ref={isLastElement ? lastLeadElementRef : null}
                      key={lead.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${selectedLeads.includes(lead.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${editingLeadId === lead.id ? 'is-editing' : ''}`}
                    >
                      {editingLeadId === lead.id ? (
                        <EditableLeadRow
                          lead={lead}
                          onSave={handleSaveEdit}
                          onCancel={handleCancelEdit}
                        />
                      ) : (
                        <DisplayLeadRow
                          lead={lead}
                          selectedLeads={selectedLeads}
                          onSelectOne={handleSelectOne}
                          onEdit={handleStartEdit}
                          onDelete={setLeadIdToDelete}
                          onShowComments={onShowComments}
                          onShowLeadDetail={onShowLeadDetail}
                          getStatusIcon={getStatusIcon}
                          getStatusText={getStatusText}
                          onUpdateLead={onUpdateLead}
                        />
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {leadToDelete && (
        <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadIdToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2" />
                Tem certeza?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso removerá permanentemente o lead "{leadToDelete.nome}" do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmation} className="bg-red-600 hover:bg-red-700">
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default LeadsTable;
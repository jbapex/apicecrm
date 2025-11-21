import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import StagedLeadRow from './StagedLeadRow';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

const StagedLeadsTable = ({
  leads,
  selectedLeads,
  onSelectAll,
  onSelect,
  onUpdate,
  onImport,
  onDelete,
  settings,
  updatingLeadId,
}) => {
  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="p-4 w-12 text-left">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todos os leads"
              />
            </th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">LEAD</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">RECEBIDO EM</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">STATUS</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">ORIGEM</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">SUB ORIGEM</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">AGENDAMENTO</th>
            <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">OBSERVAÇÕES</th>
            <th className="p-4 text-right font-semibold text-gray-600 dark:text-gray-300">AÇÕES</th>
          </tr>
        </thead>
        <motion.tbody
          layout
          className="divide-y divide-gray-200 dark:divide-gray-700"
        >
          <AnimatePresence>
            {leads.map((lead) => (
              <StagedLeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.includes(lead.id)}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onImport={onImport}
                onDelete={onDelete}
                settings={settings}
                updatingLeadId={updatingLeadId}
              />
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </div>
  );
};

export default StagedLeadsTable;
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { FollowUpCard } from '@/components/followup/FollowUpCard';
import StatusChanger from './StatusChanger';
import { formatDate, formatDateTime } from '@/lib/dateUtils';

const FollowUpMobileList = ({ leads, onUpdateLead, statuses, getStatusText, openModal, activeFlowsByLead, flowActions, tasks, TaskChangerComponent }) => {
  return (
    <div className="space-y-4 pt-4 p-2 md:p-0">
      <AnimatePresence>
        {leads.map(lead => (
          <FollowUpCard 
            key={lead.id}
            lead={lead}
            StatusChangerComponent={(props) => <StatusChanger {...props} onUpdateLead={onUpdateLead}/>}
            TaskChangerComponent={TaskChangerComponent}
            onUpdateLead={onUpdateLead}
            statuses={statuses}
            getStatusText={getStatusText}
            openModal={openModal}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            activeFlowInstance={activeFlowsByLead.get(lead.id)}
            flowActions={flowActions}
            tasks={tasks}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FollowUpMobileList;
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import SendMessageModal from '@/components/modals/SendMessageModal';
import MessageHistoryModal from '@/components/modals/MessageHistoryModal';
import AddCommentModal from '@/components/modals/AddCommentModal';
import SelectFlowModal from '@/components/modals/SelectFlowModal';

const FollowUpModals = ({
  modalType,
  selectedLead,
  isChangingFlow,
  closeModal,
  onStartFlow,
}) => {
  return (
    <AnimatePresence>
      {modalType === 'send' && selectedLead && (
        <SendMessageModal 
          lead={selectedLead}
          isOpen={true}
          onClose={closeModal}
        />
      )}
      {modalType === 'history' && selectedLead && (
        <MessageHistoryModal 
          leadId={selectedLead.id}
          isOpen={true}
          onClose={closeModal}
        />
      )}
      {modalType === 'comment' && selectedLead && (
        <AddCommentModal
          leadId={selectedLead.id}
          isOpen={true}
          onClose={closeModal}
        />
      )}
      {modalType === 'start_flow' && selectedLead && (
        <SelectFlowModal
          isOpen={true}
          onClose={closeModal}
          leadId={selectedLead.id}
          onSelectFlow={onStartFlow}
          isChangingFlow={isChangingFlow}
        />
      )}
    </AnimatePresence>
  );
};

export default FollowUpModals;
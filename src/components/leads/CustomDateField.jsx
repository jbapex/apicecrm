import React from 'react';
import DateEditor from './DateEditor';

const CustomDateField = ({ lead, onUpdateLead, field, children }) => {
  return (
    <DateEditor lead={lead} onUpdateLead={onUpdateLead} field={field}>
      {children}
    </DateEditor>
  );
};

export default CustomDateField;
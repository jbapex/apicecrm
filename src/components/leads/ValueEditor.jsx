import React, { useState, useRef, useEffect } from 'react';
import { CurrencyInput, formatCurrency, getRawValue } from '@/components/ui/input-currency';
import { DollarSign } from 'lucide-react';

const ValueEditor = ({ lead, onUpdateLead }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(lead.valor || 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newValue = typeof currentValue === 'string' ? getRawValue(currentValue) : currentValue;
    if (!isNaN(newValue) && newValue !== lead.valor) {
      onUpdateLead(lead.id, { valor: newValue });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(lead.valor || 0);
      setIsEditing(false);
    }
  };

  const displayFormattedValue = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
      return '-';
    }
    return formatCurrency(value * 100);
  };

  if (isEditing) {
    return (
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <CurrencyInput
          ref={inputRef}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          placeholder="R$ 0,00"
        />
      </div>
    );
  }

  return (
    <div
      className="w-full cursor-pointer p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={(e) => {
        e.stopPropagation();
        setCurrentValue(lead.valor || 0);
        setIsEditing(true);
      }}
    >
      <div className="flex items-center text-sm">
        <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
        <span>{displayFormattedValue(lead.valor)}</span>
      </div>
    </div>
  );
};

export default ValueEditor;
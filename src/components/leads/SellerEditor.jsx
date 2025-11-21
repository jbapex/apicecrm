import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

const SellerEditor = ({ lead, onUpdateLead }) => {
  const { settings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);

  const handleSellerChange = (newSeller) => {
    const valueToUpdate = newSeller === 'sem_vendedor' ? null : newSeller;
    if (valueToUpdate !== lead.vendedor) {
      onUpdateLead(lead.id, { vendedor: valueToUpdate });
    }
    setIsEditing(false);
  };
  
  const handleOpenChange = (open) => {
    setIsEditing(open);
  };

  return (
    <div className="w-full">
      <Select
        value={lead.vendedor || 'sem_vendedor'}
        onValueChange={handleSellerChange}
        open={isEditing}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger 
          className="h-9 text-sm focus:ring-0 focus:ring-offset-0 w-full border-none bg-transparent shadow-none hover:bg-gray-100 dark:hover:bg-gray-700/50 px-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div className="flex items-center text-sm w-full truncate">
            <User className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="capitalize truncate">{lead.vendedor || 'Sem Vendedor'}</span>
          </div>
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          <SelectItem value="sem_vendedor">Sem Vendedor</SelectItem>
          {settings.sellers?.map((seller) => (
            <SelectItem key={seller} value={seller} className="capitalize">
              {seller}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SellerEditor;
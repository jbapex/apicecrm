import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Check, XCircle, X } from 'lucide-react';

const EditableListItem = ({ item, onUpdate, onDelete, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(typeof item === 'object' ? item.name : item);

  const handleSave = () => {
    const trimmedValue = value.trim();
    const originalValue = typeof item === 'object' ? item.name : item;
    if (trimmedValue && trimmedValue !== originalValue) {
      onUpdate(item, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(typeof item === 'object' ? item.name : item);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full w-full">
        {children}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 text-sm bg-white flex-grow"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
          <XCircle className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full group w-full">
      {children}
      <span className="capitalize flex-grow">{value.replace(/_/g, ' ')}</span>
      <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit className="h-3 w-3" />
      </button>
      <button onClick={() => onDelete(item)} className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default EditableListItem;
import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EditableListItem from './EditableListItem';

const ListManager = ({ title, listName, placeholder, icon: Icon }) => {
  const { settings, handleSettingsChange } = useSettings();
  const [inputValue, setInputValue] = useState('');

  const list = settings?.[listName] || [];

  const handleAddItem = () => {
    const value = inputValue.trim().toLowerCase();
    if (!value || list.map(i => i.toLowerCase()).includes(value)) {
      setInputValue('');
      return;
    }
    
    const updatedList = [...list, inputValue.trim()];
    handleSettingsChange({ ...settings, [listName]: updatedList });
    setInputValue('');
  };

  const handleDeleteItem = (itemToDelete) => {
    const updatedList = list.filter(item => item !== itemToDelete);
    handleSettingsChange({ ...settings, [listName]: updatedList });
  };

  const handleUpdateItem = (oldValue, newValue) => {
    const updatedList = list.map(item => (item === oldValue ? newValue : item));
    handleSettingsChange({ ...settings, [listName]: updatedList });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Icon className="mr-2 h-5 w-5 text-blue-500" />{title}</h2>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button onClick={handleAddItem} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((item) => (
          <EditableListItem
            key={item}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ListManager;
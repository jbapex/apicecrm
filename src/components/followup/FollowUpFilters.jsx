import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListTodo, Search } from 'lucide-react';
import TaskManagerModal from '@/components/modals/TaskManagerModal';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Input } from '@/components/ui/input';

const FollowUpFilters = ({ filters, setFilters, statuses, getStatusText, tasks, onTasksUpdate }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg card-shadow flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800 hidden lg:block">Filtros</h2>
        
        <div className="relative w-full sm:w-auto flex-grow lg:flex-grow-0 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="pl-10"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>

        <DateRangePicker 
          onDateChange={(dateRange) => handleFilterChange('dateRange', dateRange)} 
          initialRange={filters.dateRange} 
        />
        
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status.name} value={status.name}>{getStatusText(status.name)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={() => setIsTaskModalOpen(true)}
        >
          <ListTodo className="w-4 h-4 mr-2" />
          Gerenciar Tarefas
        </Button>
      </div>
      
      <TaskManagerModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tasks={tasks}
        onTasksUpdate={onTasksUpdate}
      />
    </>
  );
};

export default FollowUpFilters;
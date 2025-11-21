import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, ListTodo, Trash2, CalendarClock } from 'lucide-react';
import { add, format, isPast, subDays } from 'date-fns';

const TaskChanger = ({ lead, tasks, onUpdateLead }) => {
  const [open, setOpen] = useState(false);

  const availableTasks = useMemo(() => {
    return tasks.filter(task => {
        if (!task.available_for_statuses || task.available_for_statuses.length === 0) {
            return true; // if no status is set, show everywhere
        }
        return task.available_for_statuses.includes(lead.status);
    });
  }, [tasks, lead.status]);

  const handleTaskChange = (newTaskId) => {
    onUpdateLead(lead.id, { 
      task_id: newTaskId, 
      task_assigned_at: newTaskId ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    });
    setOpen(false);
  };

  const currentTask = tasks.find(t => t.id === lead.task_id);

  const getDueDate = () => {
    if (!currentTask) return null;
    if (currentTask.due_date_type === 'relative_to_schedule' && lead.agendamento) {
        return subDays(new Date(lead.agendamento), currentTask.due_days);
    }
    if (lead.task_assigned_at) {
        return add(new Date(lead.task_assigned_at), { days: currentTask.due_days });
    }
    return null;
  };
  
  const dueDate = getDueDate();
  const isOverdue = dueDate && isPast(dueDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[200px] justify-between"
        >
          <span className="flex items-center truncate">
            {currentTask?.due_date_type === 'relative_to_schedule' ? (
                <CalendarClock className={cn("w-4 h-4 mr-2 flex-shrink-0", isOverdue ? "text-red-500" : "text-blue-500")} />
            ) : (
                <ListTodo className={cn("w-4 h-4 mr-2 flex-shrink-0", isOverdue ? "text-red-500" : "text-gray-500")} />
            )}
            {currentTask ? (
              <span className="truncate">
                {currentTask.name} {dueDate ? `(${format(dueDate, 'dd/MM')})` : ''}
              </span>
            ) : (
              "Sem tarefa"
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-white">
        <Command>
          <CommandInput placeholder="Buscar tarefa..." />
          <CommandEmpty>Nenhuma tarefa disponível.</CommandEmpty>
          <CommandGroup>
            {availableTasks.map((task) => (
              <CommandItem
                key={task.id}
                value={task.name}
                onSelect={() => handleTaskChange(task.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      lead.task_id === task.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center">
                    {task.due_date_type === 'relative_to_schedule' && <CalendarClock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0"/>}
                    {task.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {task.due_date_type === 'relative_to_schedule' ? `D-${task.due_days}` : `D+${task.due_days}`}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          {lead.task_id && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleTaskChange(null)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover tarefa
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TaskChanger;
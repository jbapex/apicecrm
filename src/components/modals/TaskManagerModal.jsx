import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, Plus, Trash2, Edit, Save, X, Bot, CalendarClock, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const StatusTaskSelector = ({ status, allTasks, onTasksUpdate }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { settings } = useSettings();

    const selectedTaskIds = allTasks
        .filter(task => task.available_for_statuses?.includes(status.name))
        .map(task => task.id);

    const handleTaskSelection = async (taskId) => {
        const isSelected = selectedTaskIds.includes(taskId);
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const currentStatuses = task.available_for_statuses || [];
        const newStatuses = isSelected
            ? currentStatuses.filter(s => s !== status.name)
            : [...currentStatuses, status.name];

        const { error } = await supabase
            .from('follow_up_tasks')
            .update({ available_for_statuses: newStatuses, updated_at: new Date().toISOString() })
            .eq('id', taskId);

        if (error) {
            toast({ variant: "destructive", title: "Erro ao atualizar visibilidade da tarefa", description: error.message });
        } else {
            onTasksUpdate();
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[220px] justify-between h-auto min-h-[40px] flex-wrap"
                >
                    <div className="flex-grow text-left">
                        {selectedTaskIds.length > 0 ? (
                             <div className="flex flex-wrap gap-1">
                                {allTasks.filter(t => selectedTaskIds.includes(t.id)).map(t => (
                                    <Badge key={t.id} variant="secondary" className="font-normal">{t.name}</Badge>
                                ))}
                             </div>
                        ) : (
                            <span className="text-muted-foreground">Selecionar tarefas...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 bg-white">
                <Command>
                    <CommandInput placeholder="Buscar tarefa..." />
                    <CommandEmpty>Nenhuma tarefa encontrada.</CommandEmpty>
                    <CommandGroup>
                        {allTasks.map((task) => (
                            <CommandItem
                                key={task.id}
                                value={task.name}
                                onSelect={() => handleTaskSelection(task.id)}
                                className="flex items-center"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTaskIds.includes(task.id) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <span className="flex-grow">{task.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


const TaskManagerModal = ({ isOpen, onClose, tasks, onTasksUpdate }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, getStatusText } = useSettings();
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDays, setNewTaskDays] = useState('');
  const [newTaskDueDateType, setNewTaskDueDateType] = useState('relative_to_assignment');
  const [editingTask, setEditingTask] = useState(null);

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskDays.trim() || !user) return;
    const dueDays = parseInt(newTaskDays, 10);
    if (isNaN(dueDays) || dueDays < 0) {
      toast({ variant: 'destructive', title: 'Valor inválido', description: 'O prazo deve ser um número positivo.' });
      return;
    }

    const { error } = await supabase
      .from('follow_up_tasks')
      .insert({ user_id: user.id, name: newTaskName, due_days: dueDays, due_date_type: newTaskDueDateType, is_schedule_based: newTaskDueDateType === 'relative_to_schedule' });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar tarefa', description: error.message });
    } else {
      toast({ title: 'Tarefa adicionada!' });
      setNewTaskName('');
      setNewTaskDays('');
      setNewTaskDueDateType('relative_to_assignment');
      onTasksUpdate();
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.name.trim() || !String(editingTask.due_days).trim()) return;
    const dueDays = parseInt(editingTask.due_days, 10);
    if (isNaN(dueDays) || dueDays < 0) {
      toast({ variant: 'destructive', title: 'Valor inválido', description: 'O prazo deve ser um número positivo.' });
      return;
    }
    const { error } = await supabase
      .from('follow_up_tasks')
      .update({ name: editingTask.name, due_days: dueDays, due_date_type: editingTask.due_date_type, is_schedule_based: editingTask.due_date_type === 'relative_to_schedule', updated_at: new Date().toISOString() })
      .eq('id', editingTask.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar tarefa', description: error.message });
    } else {
      toast({ title: 'Tarefa atualizada!' });
      setEditingTask(null);
      onTasksUpdate();
    }
  };

  const handleDeleteTask = async (taskId) => {
    const { error } = await supabase
      .from('follow_up_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir tarefa', description: error.message });
    } else {
      toast({ title: 'Tarefa excluída!' });
      onTasksUpdate();
    }
  };

  const getPrazoLabel = (type) => {
    return type === 'relative_to_schedule' ? 'Dias antes do agendamento' : 'Prazo (dias após atribuir)';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center"><ListTodo className="mr-2"/>Gerenciar Tarefas de Follow-up</DialogTitle>
          <DialogDescription>
            Crie e edite tarefas, e defina quais tarefas estão disponíveis para cada status de lead.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-2">Adicionar Nova Tarefa</h3>
                    <div className='mb-2'>
                        <Label htmlFor="task-name">Nome da Tarefa</Label>
                        <Input id="task-name" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="Ex: Enviar D+1 ou Confirmar D-1" />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Label htmlFor="task-due-type">Tipo de Vencimento</Label>
                            <Select value={newTaskDueDateType} onValueChange={setNewTaskDueDateType}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relative_to_assignment">Relativo à Atribuição</SelectItem>
                                    <SelectItem value="relative_to_schedule">Relativo ao Agendamento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Label htmlFor="task-days">{getPrazoLabel(newTaskDueDateType)}</Label>
                            <Input id="task-days" type="number" value={newTaskDays} onChange={e => setNewTaskDays(e.target.value)} placeholder="Ex: 1" />
                        </div>
                        <Button onClick={handleAddTask} size="icon"><Plus /></Button>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-2">Tarefas Existentes</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                        {editingTask?.id === task.id ? (
                            <>
                            <Input value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} className="flex-grow"/>
                            <Select value={editingTask.due_date_type} onValueChange={(v) => setEditingTask({...editingTask, due_date_type: v})}>
                                <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relative_to_assignment">À Atribuição</SelectItem>
                                    <SelectItem value="relative_to_schedule">Ao Agendamento</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="number" value={editingTask.due_days} onChange={e => setEditingTask({...editingTask, due_days: e.target.value})} className="w-24" title={getPrazoLabel(editingTask.due_date_type)}/>
                            <Button onClick={handleUpdateTask} size="icon" variant="ghost" className="text-green-600 hover:text-green-700"><Save className="w-4 h-4" /></Button>
                            <Button onClick={() => setEditingTask(null)} size="icon" variant="ghost" className="text-gray-600 hover:text-gray-700"><X className="w-4 h-4" /></Button>
                            </>
                        ) : (
                            <>
                            {task.due_date_type === 'relative_to_schedule' && <CalendarClock className="w-4 h-4 text-blue-500 flex-shrink-0" title="Vencimento baseado no agendamento"/>}
                            <span className="flex-grow">{task.name} ({task.due_days} {task.due_days > 1 ? 'dias' : 'dia'})</span>
                            <Button onClick={() => setEditingTask({...task, due_date_type: task.due_date_type || 'relative_to_assignment'})} size="icon" variant="ghost"><Edit className="w-4 h-4" /></Button>
                            <Button onClick={() => handleDeleteTask(task.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-medium mb-2 flex items-center"><Bot className="w-5 h-5 mr-2" />Visibilidade de Tarefas por Status</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Escolha quais tarefas estarão disponíveis para seleção em cada status do lead.
                </p>
                <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-2">
                    {settings?.statuses?.map(status => (
                        <div key={status.name} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{getStatusText(status.name)}</span>
                            <StatusTaskSelector 
                                status={status} 
                                allTasks={tasks} 
                                onTasksUpdate={onTasksUpdate} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskManagerModal;
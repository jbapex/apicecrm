import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, AlertTriangle, Filter, PlusCircle, LayoutGrid, List, Package } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LeadsHeader = ({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  onExport,
  selectedLeads,
  onBulkDelete,
  onAddNewLead,
  viewMode,
  setViewMode,
}) => {
  const { settings } = useSettings();
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(false);

  const handleBulkDelete = () => {
    onBulkDelete(selectedLeads);
    setBulkDeleteConfirmation(false);
  };

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'Todos' }];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const month = subMonths(currentDate, i);
      options.push({
        value: format(month, 'yyyy-MM'),
        label: format(month, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  };
  
  const FilterDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="md:hidden w-full">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="input-field"
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {settings.statuses?.map(status => (
                <option key={status.name} value={status.name} className="capitalize">
                  {status.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
            <select
              value={filters.vendedor}
              onChange={(e) => setFilters({ ...filters, vendedor: e.target.value })}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {settings.sellers?.map(seller => <option key={seller} value={seller}>{seller}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <input
              type="text"
              placeholder="Filtrar por produto..."
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button>Aplicar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 sm:p-6 card-shadow">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full md:w-80">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
          <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mês</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="input-field"
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {settings.statuses?.map(status => (
                <option key={status.name} value={status.name} className="capitalize">
                  {status.name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendedor</label>
            <select
              value={filters.vendedor}
              onChange={(e) => setFilters({ ...filters, vendedor: e.target.value })}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {settings.sellers?.map(seller => <option key={seller} value={seller}>{seller}</option>)}
            </select>
          </div>
          <div className="hidden md:block">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
            <input
              type="text"
              placeholder="Filtrar por produto..."
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-md p-1">
              <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
              <Button size="icon" variant={viewMode === 'kanban' ? 'default' : 'ghost'} onClick={() => setViewMode('kanban')} className="h-8 w-8">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <FilterDialog />
            <Button onClick={onExport} variant="outline" className="flex-1 md:flex-initial">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button onClick={onAddNewLead} className="flex-1 md:flex-initial">
              <PlusCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>
        </div>
        {selectedLeads.length > 0 && viewMode !== 'kanban' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
              {selectedLeads.length} {selectedLeads.length === 1 ? 'lead selecionado' : 'leads selecionados'}
            </span>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirmation(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir selecionados
            </Button>
          </div>
        )}
      </div>

      {bulkDeleteConfirmation && (
        <AlertDialog open={bulkDeleteConfirmation} onOpenChange={setBulkDeleteConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2" />
                Excluir leads selecionados?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja excluir os {selectedLeads.length} leads selecionados? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default LeadsHeader;
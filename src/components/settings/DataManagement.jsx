import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Save, Upload, Globe, Users, Trash2, Database, Download } from 'lucide-react';

const SaveTemplateDialog = ({ onSave }) => {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Salvar Config. Atual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Salvar Configuração como Padrão Pessoal</DialogTitle>
          <DialogDescription>
            Dê um nome para este conjunto de configurações. Ele ficará salvo apenas para você.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Padrão de Vendas"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RestoreTemplateDialog = ({ templates, onRestore, onSetGlobal, onDelete }) => {
  const [open, setOpen] = useState(false);

  const handleRestore = (template) => {
    onRestore(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Gerenciar Padrões
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar e Restaurar Padrões</DialogTitle>
          <DialogDescription>
            Selecione um padrão para restaurar, ou gerencie seus padrões salvos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
          {templates.map((template, index) => (
            <div key={template.id || `system-${index}`} className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleRestore(template)}
              >
                {template.is_global ? <Globe className="mr-2 h-4 w-4 text-green-500" /> : <Users className="mr-2 h-4 w-4 text-blue-500" />}
                {template.name}
              </Button>
              {template.id && !template.is_global && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Definir como Padrão Global">
                      <Globe className="h-5 w-5 text-green-600"/>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Definir como Padrão Global?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isto irá substituir o padrão global atual pelas configurações de "{template.name}". Todos os novos usuários usarão este padrão. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onSetGlobal(template)}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {template.id && !template.is_global && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Excluir Padrão">
                      <Trash2 className="h-5 w-5 text-red-600"/>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o padrão "{template.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(template)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DataManagement = ({ templates, onRestore, onSetGlobal, onDelete, onSave, onImportClick, onExportBackup }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center"><Database className="mr-2 h-5 w-5 text-blue-500" />Gerenciamento de Dados</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RestoreTemplateDialog templates={templates} onRestore={onRestore} onSetGlobal={onSetGlobal} onDelete={onDelete} />
        <SaveTemplateDialog onSave={onSave} />
        <Button onClick={onImportClick} variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Importar (CSV)
        </Button>
        <Button onClick={onExportBackup} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Exportar Backup
        </Button>
      </div>
    </div>
  );
};

export default DataManagement;
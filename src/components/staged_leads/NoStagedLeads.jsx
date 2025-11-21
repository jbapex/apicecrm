import React from 'react';
import { Inbox, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NoStagedLeads = ({ onRefresh, searchTerm }) => {
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[400px]">
        <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Nenhum Lead Encontrado</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
          Não encontramos nenhum lead correspondente à sua busca por "{searchTerm}".
        </p>
         <Button onClick={onRefresh} variant="outline" className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpar busca e recarregar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[400px]">
      <Inbox className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Caixa de Entrada Vazia</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
        Nenhum lead novo para gerenciar no momento. Assim que um novo lead chegar, ele aparecerá aqui.
      </p>
       <Button onClick={onRefresh} variant="outline" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Verificar novamente
      </Button>
    </div>
  );
};

export default NoStagedLeads;
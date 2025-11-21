import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/common/DateRangePicker';

const StagedLeadsHeader = ({ loading, onRefresh, searchTerm, onSearchChange, onDateChange, leadsCount }) => {
  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 sm:p-6 card-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                    Caixa de Entrada
                </h1>
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                    {leadsCount}
                </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={onSearchChange}
                        className="input-field pl-10 w-full"
                    />
                </div>
                <DateRangePicker onDateChange={onDateChange} />
                <Button onClick={onRefresh} disabled={loading} variant="outline" className="flex-shrink-0">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>
        </div>
    </div>
  );
};

export default StagedLeadsHeader;
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Loader2, UserPlus, Layers, RefreshCw, Search, MessageSquare, Facebook, Globe, HelpCircle, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StatCard = ({ title, value, icon: Icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const TintimLeadsHeader = ({
    numToCreate,
    numToConsolidate,
    actionInProgress,
    loading,
    onBulkCreate,
    onBulkConsolidate,
    onRefresh,
    sourceStats,
    filters,
    onFilterChange,
}) => {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciador de Leads Tintim</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie e consolide informações dos leads recebidos pela integração.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {numToCreate > 0 && (
                        <Button onClick={onBulkCreate} disabled={!!actionInProgress} variant="secondary">
                            {actionInProgress === 'bulk-create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Criar {numToCreate} Leads
                        </Button>
                    )}
                    {numToConsolidate > 0 && (
                        <Button onClick={onBulkConsolidate} disabled={!!actionInProgress}>
                            {actionInProgress === 'bulk-consolidate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
                            Consolidar {numToConsolidate}
                        </Button>
                    )}
                    <Button onClick={onRefresh} disabled={loading} variant="outline">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard title="Total" value={sourceStats.total} icon={MessageSquare} />
                <StatCard title="Meta Ads" value={sourceStats['Meta Ads']} icon={Facebook} />
                <StatCard title="Google Ads" value={sourceStats['Google Ads']} icon={Globe} />
                <StatCard title="Não Rastreada" value={sourceStats['Não Rastreada']} icon={HelpCircle} />
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative flex-grow lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input 
                                type="text" 
                                placeholder="Buscar por nome ou telefone..." 
                                value={filters.searchTerm} 
                                onChange={(e) => onFilterChange('searchTerm', e.target.value)} 
                                className="pl-10"
                            />
                        </div>
                        <Select value={filters.source} onValueChange={(value) => onFilterChange('source', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por origem" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Origens</SelectItem>
                                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                                <SelectItem value="Google Ads">Google Ads</SelectItem>
                                <SelectItem value="Não Rastreada">Não Rastreada</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="new">Novo Lead</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="consolidated">Consolidado</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="lg:col-span-4">
                            <DateRangePicker onDateChange={(value) => onFilterChange('dateRange', value)} defaultLabel="Filtrar por data" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default TintimLeadsHeader;
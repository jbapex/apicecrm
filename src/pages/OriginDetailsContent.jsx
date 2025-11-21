import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User, Info, Phone, FileText, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const OriginDetailsContent = ({ origin, dateRange, onBack, onShowLeadDetail }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subOriginFilter, setSubOriginFilter] = useState('all');
  const { toast } = useToast();
  const { settings, getStatusText } = useSettings();

  const subOrigins = useMemo(() => {
    if (settings?.sub_origins && settings.sub_origins[origin]) {
      return settings.sub_origins[origin];
    }
    return [];
  }, [settings, origin]);

  const getStatusColor = (statusName) => {
    const status = settings?.statuses?.find(s => s.name === statusName);
    return status ? status.color : '#888888';
  };

  const fetchLeadsByOrigin = useCallback(async () => {
    setLoading(true);
    if (!origin || !dateRange) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('leads')
      .select('*')
      .eq('origem', origin)
      .gte('data_entrada', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('data_entrada', format(dateRange.to, 'yyyy-MM-dd'));

    if (searchQuery) {
      query = query.or(`nome.ilike.%${searchQuery}%,whatsapp.ilike.%${searchQuery}%`);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (subOriginFilter !== 'all') {
      query = query.eq('sub_origem', subOriginFilter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao buscar leads',
        description: `Não foi possível carregar os leads da origem "${origin}".`,
        variant: 'destructive',
      });
      setLeads([]);
    } else {
      setLeads(data);
    }
    setLoading(false);
  }, [origin, dateRange, toast, searchQuery, statusFilter, subOriginFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLeadsByOrigin();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchLeadsByOrigin]);

  return (
    <>
      <Helmet>
        <title>Detalhes da Origem: {origin} - Ápice CRM</title>
        <meta name="description" content={`Análise detalhada dos leads da origem ${origin}.`} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col"
      >
        <div className="flex items-center mb-6 gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Detalhes da Origem: {origin}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Exibindo leads de {format(dateRange.from, 'dd/MM/yyyy')} a {format(dateRange.to, 'dd/MM/yyyy')}.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Leads Gerados
            </CardTitle>
            <CardDescription>
              Lista de todos os leads gerados pela origem "{origin}" no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nome ou contato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={subOriginFilter} onValueChange={setSubOriginFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por suborigem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Suborigens</SelectItem>
                  {subOrigins.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {settings?.statuses?.map((status) => (
                    <SelectItem key={status.name} value={status.name}>
                      {getStatusText(status.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Nenhum lead encontrado para esta origem e filtros no período selecionado.
              </div>
            ) : (
              <TooltipProvider>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead><Phone className="inline-block mr-1 h-4 w-4" />Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Suborigem</TableHead>
                        <TableHead><FileText className="inline-block mr-1 h-4 w-4" />Observações</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.nome}</TableCell>
                          <TableCell>{lead.whatsapp}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: getStatusColor(lead.status), color: 'white' }} variant="default">
                              {getStatusText(lead.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.vendedor || 'N/A'}</TableCell>
                          <TableCell>{lead.sub_origem || 'N/A'}</TableCell>
                          <TableCell>
                            {lead.observacoes ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <p className="truncate max-w-[150px]">{lead.observacoes}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{lead.observacoes}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(lead.valor)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => onShowLeadDetail(lead)}>
                              <Info className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default OriginDetailsContent;
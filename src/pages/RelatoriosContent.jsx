import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, DollarSign, TrendingUp, Loader2, Package, Bot, ExternalLink } from 'lucide-react';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import useReports from '@/hooks/useReports.js';
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Bar, FunnelChart, Funnel, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSettings } from '@/contexts/SettingsContext.jsx';
import AutomaticReports from '@/components/reports/AutomaticReports';
import { Button } from '@/components/ui/button';

const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const GeneralPerformanceReport = ({ data, loading }) => {
  const { settings } = useSettings();
  const analyticsLabels = settings?.analytics_labels || {
    agendamento: 'Agendamentos',
    comparecimento: 'Comparecimentos',
    venda: 'Vendas',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!data) {
    return <div className="text-center text-gray-500 py-10">Selecione um período para ver os dados.</div>;
  }

  const conversionRate = data.total_leads > 0 ? (data.total_vendas / data.total_leads) * 100 : 0;

  const stats = [
    { title: "Total de Leads", value: data.total_leads, icon: Users, color: "text-blue-500" },
    { title: "Taxa de Conversão", value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-green-500" },
    { title: "Valor Total em Vendas", value: formatCurrency(data.total_valor_vendas), icon: DollarSign, color: "text-yellow-500" },
    { title: analyticsLabels.agendamento, value: data.total_agendamentos, icon: BarChart, color: "text-purple-500" },
  ];

  const funnelData = [
    { name: 'Leads', value: data.funil_de_vendas.total, fill: '#8884d8' },
    { name: analyticsLabels.agendamento, value: data.funil_de_vendas.agendados, fill: '#83a6ed' },
    { name: analyticsLabels.comparecimento, value: data.funil_de_vendas.compareceram, fill: '#8dd1e1' },
    { name: analyticsLabels.venda, value: data.funil_de_vendas.venderam, fill: '#82ca9d' },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={data.leads_por_origem} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis dataKey="origem" type="category" width={80} />
                <Tooltip formatter={(value) => [value, 'Leads']} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Total de Leads" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="value" formatter={(value) => value} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const VendedoresReport = ({ data, loading }) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!data || !data.vendas_por_vendedor || data.vendas_por_vendedor.length === 0) {
    return <div className="text-center text-gray-500 py-10">Nenhum dado de vendas por vendedor para o período selecionado.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Análise de Vendas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Nº de Vendas</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vendas_por_vendedor.map((vendedor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{vendedor.vendedor}</TableCell>
                  <TableCell className="text-right">{vendedor.sales_count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendedor.total_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OrigensReport = ({ data, loading, onNavigateToOriginDetails, dateRange }) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!data || !data.conversao_por_origem || data.conversao_por_origem.length === 0) {
    return <div className="text-center text-gray-500 py-10">Nenhum dado de conversão por origem para o período selecionado.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Análise de Conversão por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Total de Leads</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Taxa de Conversão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.conversao_por_origem.map((origem, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{origem.origem}</TableCell>
                  <TableCell className="text-right">{origem.total_leads}</TableCell>
                  <TableCell className="text-right">{origem.total_vendas}</TableCell>
                  <TableCell className="text-right font-semibold">{origem.taxa_conversao.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onNavigateToOriginDetails(origem.origem, dateRange)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ProdutosReport = ({ data, loading }) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!data || !data.vendas_por_produto || data.vendas_por_produto.length === 0) {
    return <div className="text-center text-gray-500 py-10">Nenhum dado de vendas por produto para o período selecionado.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Análise de Vendas por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Package className="inline-block mr-2 h-4 w-4" />Produto</TableHead>
                <TableHead className="text-right">Nº de Vendas</TableHead>
                <TableHead className="text-right">Valor Total Gerado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vendas_por_produto.map((produto, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{produto.product_name}</TableCell>
                  <TableCell className="text-right">{produto.sales_count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(produto.total_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RelatoriosContent = ({ onNavigateToOriginDetails }) => {
  const [activeReport, setActiveReport] = useState("geral");
  
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const {
    loading: reportLoading,
    reportData,
    filters,
    setFilters,
  } = useReports();
  
  const handleDateChange = (newDate) => {
    const period = (newDate.from && newDate.to) ? 'custom' : 'current_month';
    setDate(newDate);
    setFilters(prev => ({
      ...prev,
      period: period,
      customRange: { from: newDate.from, to: newDate.to }
    }));
  };

  return (
    <>
      <Helmet>
        <title>Relatórios - Ápice CRM</title>
        <meta name="description" content="Analise o desempenho e gere relatórios para tomar decisões estratégicas." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Central de Relatórios</h1>
            <p className="text-gray-500 dark:text-gray-400">Analise dados e extraia insights para otimizar sua operação.</p>
          </div>
          <DateRangePicker onDateChange={handleDateChange} initialRange={date} />
        </div>

        <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 h-auto sm:h-10">
            <TabsTrigger value="geral" className="py-2 sm:py-1.5">Desempenho Geral</TabsTrigger>
            <TabsTrigger value="vendedores" className="py-2 sm:py-1.5">Análise de Vendedores</TabsTrigger>
            <TabsTrigger value="origens" className="py-2 sm:py-1.5">Conversão por Origem</TabsTrigger>
            <TabsTrigger value="produtos" className="py-2 sm:py-1.5">Relatório de Produtos</TabsTrigger>
            <TabsTrigger value="automaticos" className="py-2 sm:py-1.5 flex items-center gap-2">
              <Bot className="h-4 w-4" /> Relatórios Automáticos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="geral" className="mt-6">
            <GeneralPerformanceReport data={reportData} loading={reportLoading} />
          </TabsContent>
          <TabsContent value="vendedores" className="mt-6">
            <VendedoresReport data={reportData} loading={reportLoading} />
          </TabsContent>
          <TabsContent value="origens" className="mt-6">
            <OrigensReport data={reportData} loading={reportLoading} onNavigateToOriginDetails={onNavigateToOriginDetails} dateRange={date} />
          </TabsContent>
          <TabsContent value="produtos" className="mt-6">
            <ProdutosReport data={reportData} loading={reportLoading} />
          </TabsContent>
          <TabsContent value="automaticos" className="mt-6">
            <AutomaticReports />
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default RelatoriosContent;
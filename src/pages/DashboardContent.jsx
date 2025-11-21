import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, UserX, BarChart3, Info, Inbox } from 'lucide-react';
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useSettings } from '@/contexts/SettingsContext';

const FunnelGraph = ({ data }) => {
  const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart>
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            border: '1px solid #ddd', 
            borderRadius: '0.5rem',
            backdropFilter: 'blur(5px)'
          }}
        />
        <Funnel
          dataKey="value"
          data={data}
          isAnimationActive
          nameKey="name"
        >
          <LabelList 
            position="center" 
            fill="#fff" 
            stroke="none" 
            dataKey="value" 
            formatter={(value) => value}
            style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

const DashboardContent = ({ dashboardHook, stagedLeadsCount = 0 }) => {
  const { metrics, recentLeads, loading, filters, setFilters } = dashboardHook;
  const { settings } = useSettings();

  const analyticsLabels = useMemo(() => settings?.analytics_labels || {
    agendamento: 'Agendamentos',
    comparecimento: 'Comparecimentos',
    venda: 'Vendas',
  }, [settings]);

  const funnelData = useMemo(() => [
    { name: 'Leads', value: metrics.totalLeads },
    { name: analyticsLabels.agendamento, value: metrics.agendamentos },
    { name: analyticsLabels.comparecimento, value: metrics.comparecimentos },
    { name: analyticsLabels.venda, value: metrics.vendas },
  ], [metrics, analyticsLabels]);

  const metricItems = useMemo(() => [
    { label: 'Leads (período)', value: metrics.totalLeads, icon: Users, color: 'blue' },
    { label: `${analyticsLabels.agendamento} (período)`, value: metrics.agendamentos, icon: Calendar, color: 'yellow' },
    { label: `${analyticsLabels.venda} (período)`, value: metrics.vendas, icon: TrendingUp, color: 'green' },
    { label: 'No-Show (período)', value: metrics.noShow, icon: UserX, color: 'red' },
  ], [metrics, analyticsLabels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-end">
        <DateRangePicker onDateChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))} initialRange={filters.dateRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <motion.div
          className="metric-card"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center">
            <div className={`p-2 sm:p-3 bg-purple-100 rounded-lg`}>
              <Inbox className={`w-5 h-5 sm:w-6 sm:h-6 text-purple-600`} />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Leads na Fila</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stagedLeadsCount}</p>
            </div>
          </div>
        </motion.div>
        {metricItems.map((item, index) => (
          <motion.div
            key={index}
            className="metric-card"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 bg-${item.color}-100 rounded-lg`}>
                <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${item.color}-600`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div
          className="lg:col-span-3"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="h-full bg-gradient-to-br from-white to-gray-50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Funil de Vendas</CardTitle>
                  <CardDescription>Performance no período selecionado</CardDescription>
                </div>
                <div className="flex items-center text-2xl font-bold text-green-600 bg-green-100/80 px-4 py-2 rounded-lg border border-green-200">
                  <span className="flex items-center">
                    R$ {metrics.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {metrics.totalLeads > 0 ? (
                <FunnelGraph data={funnelData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50/50 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Sem dados de leads para este período.</p>
                    <p className="text-sm text-gray-400">Adicione novos leads para ver o funil.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="metric-card lg:col-span-2"
          whileHover={{ y: -5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Recentes</h3>
          <div className="space-y-3">
            {recentLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{lead.nome}</p>
                  <p className="text-sm text-gray-600 capitalize">{lead.origem || 'N/A'}</p>
                </div>
                <span className={`status-badge status-${lead.status || 'default'} capitalize`}>
                  {lead.status ? lead.status.replace(/_/g, ' ') : 'Sem status'}
                </span>
              </div>
            ))}
             {recentLeads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                 <Info className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p>Nenhum lead recente encontrado.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardContent;
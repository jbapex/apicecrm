import { useMemo } from 'react';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

const useLeadsMetrics = (leads, filters) => {
  const { settings } = useSettings();

  const metrics = useMemo(() => {
    const now = new Date();
    const startDate = filters.dateRange?.from || startOfMonth(now);
    const endDate = filters.dateRange?.to || endOfMonth(now);

    const leadsInDateRange = leads.filter(lead => {
      if (!lead.data_entrada) return false;
      try {
        const leadDate = parseISO(lead.data_entrada);
        return isWithinInterval(leadDate, { start: startDate, end: endDate });
      } catch (error) {
        return false;
      }
    });

    const totalLeads = leadsInDateRange.length;
    const agendamentos = leadsInDateRange.filter(l => l.agendamento).length;
    const comparecimentos = leadsInDateRange.filter(l => ['compareceu', 'vendeu'].includes(l.status)).length;
    const vendas = leadsInDateRange.filter(l => l.status === 'vendeu').length;
    const noShow = leadsInDateRange.filter(l => l.status === settings?.noshow_status).length;
    
    const valorTotal = leadsInDateRange
      .filter(l => l.status === 'vendeu')
      .reduce((sum, lead) => sum + (Number(lead.valor) || 0), 0);

    const weeklyData = leads.reduce((acc, lead) => {
      if (!lead.data_entrada) return acc;
      const leadDate = parseISO(lead.data_entrada);
      const year = getYear(leadDate);
      const week = getWeek(leadDate, { weekStartsOn: 1 });
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
      
      if (!acc[weekKey]) {
        const start = startOfWeek(leadDate, { weekStartsOn: 1 });
        const end = endOfWeek(leadDate, { weekStartsOn: 1 });
        acc[weekKey] = {
          week: weekKey,
          startDate: start,
          endDate: end,
          leads: 0,
          agendados: 0,
          compareceu: 0,
          vendeu: 0,
          noShow: 0,
          valor: 0,
        };
      }
      
      acc[weekKey].leads++;
      if (lead.agendamento) acc[weekKey].agendados++;
      if (['compareceu', 'vendeu'].includes(lead.status)) acc[weekKey].compareceu++;
      if (lead.status === 'vendeu') {
        acc[weekKey].vendeu++;
        acc[weekKey].valor += Number(lead.valor) || 0;
      }
      if (lead.status === settings?.noshow_status) acc[weekKey].noShow++;

      return acc;
    }, {});
    
    return {
      totalLeads,
      agendamentos,
      comparecimentos,
      vendas,
      noShow,
      valorTotal,
      weeklyData: Object.values(weeklyData).sort((a,b) => b.week.localeCompare(a.week)),
    };
  }, [leads, filters.dateRange, settings]);

  return metrics;
};

export default useLeadsMetrics;
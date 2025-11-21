import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useWeeklyData from '@/hooks/useWeeklyData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DollarSign, BarChart, Calendar, UserCheck, TrendingUp, Target, Percent, Coins, UserPlus, ShoppingCart, Save, Zap, Settings as SettingsIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeekRowCard } from '@/components/week/WeekRowCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWeeklyLeads } from '@/hooks/useWeeklyLeads';
import WeeklyAnalyticsSettings from '@/components/week/WeeklyAnalyticsSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

const MetricCard = ({ icon, label, value, color, format }) => {
  const Icon = icon;
  const formattedValue = typeof format === 'function' ? format(value) : value;

  return (
    <div className={`bg-white p-3 rounded-lg card-shadow flex items-start space-x-3 border-l-4 border-${color}-500 sm:p-4`}>
      <div className={`p-1.5 bg-${color}-100 rounded-full`}>
        <Icon className={`w-4 h-4 sm:w-5 h-5 text-${color}-600`} />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base sm:text-lg font-bold text-gray-800">{formattedValue}</p>
      </div>
    </div>
  );
};

const MultiSelectFilter = ({ title, options, selectedValues, onSelectionChange }) => {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(selectedValues);

  const handleSelect = (currentValue) => {
    const newSelected = new Set(selectedSet);
    if (newSelected.has(currentValue)) {
      newSelected.delete(currentValue);
    } else {
      newSelected.add(currentValue);
    }
    onSelectionChange(Array.from(newSelected));
  };

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{title}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[38px] flex-wrap text-sm"
          >
            <div className="flex flex-wrap gap-1">
              {selectedValues.length > 0 ? (
                selectedValues.map((value) => (
                  <Badge variant="secondary" key={value} className="mr-1 capitalize">
                    {value}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 font-normal">Todas</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={handleSelect}
                  className="capitalize"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedSet.has(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const WeekContent = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { leads, loading: leadsLoading, fetchLeadsForMonth } = useWeeklyLeads();
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();

  const analyticsLabels = useMemo(() => settings?.analytics_labels || {
    agendamento: 'Agendamentos',
    comparecimento: 'Comparecimentos',
    venda: 'Vendas',
  }, [settings]);

  const {
    weeklyInvestments,
    handleInvestmentChange,
    saveInvestments,
    loading: investmentsLoading,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    monthlyMetrics,
    weeklyData,
    formatCurrency,
    formatPercent,
    selectedOrigens,
    setSelectedOrigens,
    origemOptions,
    selectedSubOrigens,
    setSelectedSubOrigens,
    subOrigemOptions,
  } = useWeeklyData(leads);

  useEffect(() => {
    const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    fetchLeadsForMonth(monthString);
  }, [selectedYear, selectedMonth, fetchLeadsForMonth]);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (leadsLoading || investmentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      key="week"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="bg-white rounded-lg p-3 sm:p-4 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Análise Semanal</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t pt-4 mt-4"
            >
              <WeeklyAnalyticsSettings />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input-field text-sm">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="input-field text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <MultiSelectFilter
            title="Origem"
            options={origemOptions}
            selectedValues={selectedOrigens}
            onSelectionChange={setSelectedOrigens}
          />
          <MultiSelectFilter
            title="Sub Origem"
            options={subOrigemOptions}
            selectedValues={selectedSubOrigens}
            onSelectionChange={setSelectedSubOrigens}
          />
        </div>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg card-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800">Desempenho Semanal</h3>
            <Button onClick={saveInvestments} className="btn-primary flex items-center w-full sm:w-auto text-sm px-3 py-1.5">
                <Save className="w-4 h-4 mr-2" />
                Salvar Investimentos
            </Button>
        </div>
        
        {isMobile ? (
          <div className="space-y-4">
            {weeklyData.map((week, index) => (
              <WeekRowCard
                key={index}
                week={week}
                index={index}
                weeklyInvestments={weeklyInvestments}
                handleInvestmentChange={handleInvestmentChange}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                labels={analyticsLabels}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-1 py-2 text-left text-xs sm:text-sm">Sem.</th>
                  <th className="px-1 py-2 text-left text-xs sm:text-sm">Invest.</th>
                  <th className="px-1 py-2 text-left text-xs sm:text-sm">Leads</th>
                  <th title={analyticsLabels.agendamento} className="px-1 py-2 text-left text-xs sm:text-sm cursor-pointer">{analyticsLabels.agendamento.substring(0,5)}.</th>
                  <th title={analyticsLabels.comparecimento} className="px-1 py-2 text-left text-xs sm:text-sm cursor-pointer">{analyticsLabels.comparecimento.substring(0,5)}.</th>
                  <th title={analyticsLabels.venda} className="px-1 py-2 text-left text-xs sm:text-sm cursor-pointer">{analyticsLabels.venda.substring(0,5)}.</th>
                  <th className="px-1 py-2 text-left text-xs sm:text-sm hidden sm:table-cell">Ticket</th>
                  <th title={`Leads para ${analyticsLabels.agendamento}`} className="px-1 py-2 text-left text-xs sm:text-sm hidden md:table-cell cursor-pointer">L→A %</th>
                  <th title={`${analyticsLabels.agendamento} para ${analyticsLabels.comparecimento}`} className="px-1 py-2 text-left text-xs sm:text-sm hidden md:table-cell cursor-pointer">A→C %</th>
                  <th title={`${analyticsLabels.comparecimento} para ${analyticsLabels.venda}`} className="px-1 py-2 text-left text-xs sm:text-sm hidden lg:table-cell cursor-pointer">C→V %</th>
                  <th title={`Leads para ${analyticsLabels.venda}`} className="px-1 py-2 text-left text-xs sm:text-sm hidden lg:table-cell cursor-pointer">L→V %</th>
                  <th className="px-1 py-2 text-left text-xs sm:text-sm hidden sm:table-cell">ROAS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs sm:text-sm">
                {weeklyData.map((week, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-1 py-2 font-medium whitespace-nowrap">
                      <div>{week.name}</div>
                      <div className="text-xs text-gray-500">
                        {format(week.startDate, 'dd/MM', { locale: ptBR })} - {format(week.endDate, 'dd/MM', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-24 sm:w-32">
                         <span className="bg-gray-100 text-gray-600 text-xs sm:text-sm px-1.5 py-1 border-r border-gray-300">R$</span>
                         <input
                            type="number"
                            value={weeklyInvestments[index]}
                            onChange={(e) => handleInvestmentChange(index, Number(e.target.value))}
                            className="flex-grow p-1 text-xs sm:text-sm focus:outline-none w-full"
                            placeholder="0.00"
                          />
                      </div>
                    </td>
                    <td className="px-1 py-2">{week.leads}</td>
                    <td className="px-1 py-2">{week.agendamentos}</td>
                    <td className="px-1 py-2">{week.comparecimentos}</td>
                    <td className="px-1 py-2">{week.vendas}</td>
                    <td className="px-1 py-2 hidden sm:table-cell">{formatCurrency(week.ticketMedio)}</td>
                    <td className="px-1 py-2 hidden md:table-cell">{formatPercent(week.taxaLeadAgendamento)}</td>
                    <td className="px-1 py-2 hidden md:table-cell">{formatPercent(week.taxaAgendamentoComparecimento)}</td>
                    <td className="px-1 py-2 hidden lg:table-cell">{formatPercent(week.taxaComparecimentoVenda)}</td>
                    <td className="px-1 py-2 hidden lg:table-cell">{formatPercent(week.taxaLeadVenda)}</td>
                    <td className="px-1 py-2 hidden sm:table-cell">{week.roas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg card-shadow">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-800">Resultados do Mês</h3>
          <div className="space-y-2 sm:space-y-3">
            <MetricCard icon={DollarSign} label="Investimento Total" value={monthlyMetrics.investimento} format={formatCurrency} color="blue" />
            <MetricCard icon={BarChart} label="Nº de Leads" value={monthlyMetrics.totalLeads} color="blue" />
            <MetricCard icon={Calendar} label={`Nº de ${analyticsLabels.agendamento}`} value={monthlyMetrics.agendamentos} color="orange" />
            <MetricCard icon={UserCheck} label={`Nº de ${analyticsLabels.comparecimento}`} value={monthlyMetrics.comparecimentos} color="yellow" />
            <MetricCard icon={TrendingUp} label={`Nº de ${analyticsLabels.venda}`} value={monthlyMetrics.vendas} color="green" />
            <MetricCard icon={Target} label="Valor Total em Vendas" value={monthlyMetrics.valorVendas} format={formatCurrency} color="green" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg card-shadow">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-800">Métricas Financeiras Mensais</h3>
          <div className="space-y-2 sm:space-y-3">
            <MetricCard icon={Coins} label="Ticket Médio" value={monthlyMetrics.ticketMedio} format={formatCurrency} color="teal" />
            <MetricCard icon={Percent} label="ROAS" value={monthlyMetrics.roas} format={(v) => `${v.toFixed(2)}x`} color="teal" />
            <MetricCard icon={UserPlus} label="Custo por Lead (CPL)" value={monthlyMetrics.custoPorLead} format={formatCurrency} color="red" />
            <MetricCard icon={ShoppingCart} label="Custo por Venda (CPV)" value={monthlyMetrics.custoPorVenda} format={formatCurrency} color="red" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg card-shadow">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-800">Taxas de Conversão Mensais</h3>
          <div className="space-y-2 sm:space-y-3">
            <MetricCard icon={Zap} label={`Leads → ${analyticsLabels.agendamento}`} value={monthlyMetrics.taxaLeadAgendamento} format={formatPercent} color="purple" />
            <MetricCard icon={Zap} label={`${analyticsLabels.agendamento} → ${analyticsLabels.comparecimento}`} value={monthlyMetrics.taxaAgendamentoComparecimento} format={formatPercent} color="purple" />
            <MetricCard icon={Zap} label={`${analyticsLabels.comparecimento} → ${analyticsLabels.venda}`} value={monthlyMetrics.taxaComparecimentoVenda} format={formatPercent} color="purple" />
            <MetricCard icon={Zap} label={`Leads → ${analyticsLabels.venda}`} value={monthlyMetrics.taxaLeadVenda} format={formatPercent} color="purple" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeekContent;
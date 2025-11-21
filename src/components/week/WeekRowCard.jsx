import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MetricItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">{value}</span>
  </div>
);

export const WeekRowCard = ({ week, index, weeklyInvestments, handleInvestmentChange, formatCurrency, formatPercent }) => {
  const formattedPeriod = week.startDate && week.endDate 
    ? `${format(week.startDate, 'dd/MM', { locale: ptBR })} - ${format(week.endDate, 'dd/MM', { locale: ptBR })}`
    : '';

  return (
    <div className="bg-white rounded-lg p-4 card-shadow space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
        <div>
          <h4 className="font-bold text-base text-blue-600">{week.name}</h4>
          {formattedPeriod && <p className="text-xs text-gray-500">{formattedPeriod}</p>}
        </div>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-32">
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1.5 border-r border-gray-300">R$</span>
          <input
            type="number"
            value={weeklyInvestments[index]}
            onChange={(e) => handleInvestmentChange(index, Number(e.target.value))}
            className="flex-grow p-1.5 text-sm focus:outline-none w-full"
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        <MetricItem label="Leads" value={week.leads} />
        <MetricItem label="Agendamentos" value={week.agendamentos} />
        <MetricItem label="Comparecimentos" value={week.comparecimentos} />
        <MetricItem label="Vendas" value={week.vendas} />
        <MetricItem label="Ticket Médio" value={formatCurrency(week.ticketMedio)} />
        <MetricItem label="ROAS" value={`${week.roas.toFixed(2)}x`} />
        <MetricItem label="L→A %" value={formatPercent(week.taxaLeadAgendamento)} />
        <MetricItem label="A→C %" value={formatPercent(week.taxaAgendamentoComparecimento)} />
        <MetricItem label="C→V %" value={formatPercent(week.taxaComparecimentoVenda)} />
        <MetricItem label="L→V %" value={formatPercent(week.taxaLeadVenda)} />
      </div>
    </div>
  );
};
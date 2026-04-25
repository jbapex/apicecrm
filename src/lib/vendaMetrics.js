/** Normaliza status para comparação (evita divergência por maiúsculas). */
export const normalizeStatus = (v) => (v || '').toString().toLowerCase().trim();

/** Status considerados “venda” nas métricas (config + vendeu). */
export function getVendaStatuses(settings) {
  const raw = settings?.analytics_mappings?.venda_statuses || [];
  const seen = new Set(raw.map(normalizeStatus));
  const list = [...raw];
  if (!seen.has('vendeu')) list.push('vendeu');
  return list;
}

export function isVendaStatus(status, vendaStatuses) {
  const sn = normalizeStatus(status);
  return vendaStatuses.some((s) => normalizeStatus(s) === sn);
}

export function hasValidValor(valor) {
  return valor !== null && valor !== undefined && !Number.isNaN(Number(valor));
}

/** Soma e ticket médio só com valor numérico (alinhado à Semana / relatórios comuns). */
export function sumVendasMetrics(leads, settings) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return { totalVendas: 0, ticketMedio: 0, count: 0 };
  }
  const vendaStatuses = getVendaStatuses(settings);
  const vendasComValor = leads.filter(
    (lead) => isVendaStatus(lead.status, vendaStatuses) && hasValidValor(lead.valor)
  );
  const totalVendas = vendasComValor.reduce((sum, lead) => sum + (Number(lead.valor) || 0), 0);
  const count = vendasComValor.length;
  const ticketMedio = count > 0 ? totalVendas / count : 0;
  return { totalVendas, ticketMedio, count };
}

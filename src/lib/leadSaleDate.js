import { parseISO, isValid } from 'date-fns';

/**
 * Data de venda no cadastro do lead: `public.leads.custom_date_field`
 * (rótulo nas settings, ex.: "Data de Venda").
 * Valores agregados nas telas usam `public.lead_vendas` (data_venda + valor_total) quando a tabela existir.
 */
export function getLeadSaleDateRaw(lead) {
  if (!lead || typeof lead !== 'object') return null;
  const v = lead.custom_date_field;
  if (v === undefined || v === null || v === '') return null;
  return v;
}

function parseDateFieldRaw(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (raw instanceof Date) return isValid(raw) ? raw : null;
  const s = typeof raw === 'string' ? raw.trim() : String(raw);
  if (!s) return null;
  const d = parseISO(s.includes('T') ? s : `${s}T12:00:00`);
  return isValid(d) ? d : null;
}

export function parseLeadSaleDate(lead) {
  const raw = getLeadSaleDateRaw(lead);
  return parseDateFieldRaw(raw);
}

export function parseLeadContactDate(lead) {
  return parseDateFieldRaw(lead?.data_entrada);
}

/** Métricas de venda no período: data da venda no banco; se vazia, usa data do contato. */
export function parseLeadSaleOrContactDate(lead) {
  return parseLeadSaleDate(lead) || parseLeadContactDate(lead);
}

/** Para funil/semana: mesma regra (data de venda do BD ou data de entrada). */
export function parseLeadDateForAnalytics(lead) {
  return parseLeadSaleOrContactDate(lead);
}

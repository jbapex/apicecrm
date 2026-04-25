import { format, parseISO, isValid, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { getVendaStatuses, isVendaStatus, hasValidValor } from '@/lib/vendaMetrics.js';
import { parseLeadSaleOrContactDate, parseLeadContactDate } from '@/lib/leadSaleDate.js';

export const LEAD_VENDAS_TABLE = 'lead_vendas';

const LEADS_VENDAS_METRICS_SELECT =
  'id, data_entrada, custom_date_field, agendamento, status, valor, nome, created_at, attended, origem, sub_origem';

function formatDay(d) {
  return format(d instanceof Date ? d : new Date(d), 'yyyy-MM-dd');
}

async function paginateLeadQuery(runPage) {
  const pageSize = 1000;
  const all = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await runPage(offset, pageSize);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * Leads para métricas de funil + vendas no período.
 * Várias consultas simples + união por id (evita OR/and do PostgREST falhar ou omitir linhas).
 */
export async function fetchLeadsForVendasMetrics(supabase, userId, rangeFrom, rangeTo) {
  const base = () =>
    supabase.from('leads').select(LEADS_VENDAS_METRICS_SELECT).eq('user_id', userId);

  if (!rangeFrom || !rangeTo) {
    const { data, error } = await base().order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  const startStr = formatDay(rangeFrom);
  const endStr = formatDay(rangeTo);
  const broaderFrom = subDays(rangeFrom, 400).toISOString();

  // Nunca comparar custom_date_field com '' — coluna é date no Postgres e gera
  // "invalid input syntax for type date: \"\""".
  const [byCustomInMonth, byEntradaNoCustom, legacyBroad] = await Promise.all([
    paginateLeadQuery((offset, ps) =>
      base()
        .not('custom_date_field', 'is', null)
        .gte('custom_date_field', startStr)
        .lte('custom_date_field', endStr)
        .order('id', { ascending: true })
        .range(offset, offset + ps - 1)
    ),
    paginateLeadQuery((offset, ps) =>
      base()
        .is('custom_date_field', null)
        .gte('data_entrada', startStr)
        .lte('data_entrada', endStr)
        .order('id', { ascending: true })
        .range(offset, offset + ps - 1)
    ),
    paginateLeadQuery((offset, ps) =>
      base()
        .or(`data_entrada.gte.${broaderFrom},custom_date_field.gte.${broaderFrom}`)
        .order('id', { ascending: true })
        .range(offset, offset + ps - 1)
    ),
  ]);

  const map = new Map();
  for (const row of [...byCustomInMonth, ...byEntradaNoCustom, ...legacyBroad]) {
    map.set(row.id, row);
  }
  return Array.from(map.values());
}

export function isLeadVendasTableMissing(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const c = error.code;
  return (
    c === '42P01' ||
    c === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    (msg.includes(LEAD_VENDAS_TABLE) && msg.includes('not find'))
  );
}

/** Quantidade de linhas em lead_vendas para o usuário (0 = ainda não migrado → usar leads). */
export async function countUserLeadVendas(supabase, userId) {
  const { count, error } = await supabase
    .from(LEAD_VENDAS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    if (isLeadVendasTableMissing(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

/** Intervalo de datas dos filtros da lista de leads (calendário mês/ano ou range). */
export function getLeadsFilterDateBounds(filters) {
  const now = new Date();
  if (filters?.dateRange?.from && filters?.dateRange?.to) {
    return { start: filters.dateRange.from, end: filters.dateRange.to };
  }
  if ((filters?.year && filters.year !== 'all') || (filters?.month && filters.month !== 'all')) {
    const year = filters?.year && filters.year !== 'all' ? Number(filters.year) : now.getFullYear();
    if (filters?.month && filters.month !== 'all') {
      const monthIndex = Number(filters.month) - 1;
      const baseDate = new Date(year, monthIndex, 1);
      return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }
    return { start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 0, 1)) };
  }
  return null;
}

export function toDateOnlyString(d) {
  if (!d) return null;
  return format(d instanceof Date ? d : new Date(d), 'yyyy-MM-dd');
}

export function parseDataVendaDate(isoDate) {
  if (!isoDate) return null;
  const d = parseISO(typeof isoDate === 'string' ? `${isoDate}T12:00:00` : String(isoDate));
  return isValid(d) ? d : null;
}

function isInRangeInclusive(dateVal, from, to) {
  if (!dateVal || !from || !to) return false;
  const d = dateVal.getTime();
  const a = from.getTime();
  const b = to.getTime();
  return d >= a && d <= b;
}

/**
 * Busca vendas na tabela lead_vendas (data_venda + valor_total no banco).
 * Retorna { rows, ok: true } ou { rows: [], ok: false } se tabela inexistente.
 */
export async function fetchLeadVendasInRange(supabase, userId, rangeStart, rangeEnd) {
  const startStr = toDateOnlyString(rangeStart);
  const endStr = toDateOnlyString(rangeEnd);
  if (!startStr || !endStr) {
    return { rows: [], ok: false, usedTable: false };
  }

  const { data, error } = await supabase
    .from(LEAD_VENDAS_TABLE)
    .select('id, valor_total, data_venda, lead_id')
    .eq('user_id', userId)
    .gte('data_venda', startStr)
    .lte('data_venda', endStr);

  if (error) {
    if (isLeadVendasTableMissing(error)) {
      return { rows: [], ok: true, usedTable: false };
    }
    throw error;
  }

  const rows = data || [];
  if (rows.length > 0) {
    return { rows, ok: true, usedTable: true };
  }

  // Tabela criada mas sem nenhuma venda cadastrada → métricas voltam a usar leads.valor
  const totalNoBanco = await countUserLeadVendas(supabase, userId);
  if (totalNoBanco === 0) {
    return { rows: [], ok: true, usedTable: false };
  }

  return { rows: [], ok: true, usedTable: true };
}

/** Chave estável para `lead.id` / `lead_vendas.lead_id` (UUID vs string no PostgREST). */
export function leadVendaLeadPk(id) {
  return id == null || id === '' ? '' : String(id);
}

/**
 * Garante que o array de leads inclua todo `lead_id` presente em `lead_vendas` no período.
 * O Dashboard já considera todas as linhas da tabela; a análise semanal precisa dos cadastros
 * para filtro de origem e para priorizar `valor` do lead no merge.
 */
export async function mergeLeadsForLeadVendaRows(supabase, userId, leads, vRows) {
  if (!vRows?.length) return leads || [];
  const byId = new Map((leads || []).map((l) => [leadVendaLeadPk(l.id), l]));
  const missing = [
    ...new Set(
      vRows.map((r) => r.lead_id).filter((id) => id != null && !byId.has(leadVendaLeadPk(id)))
    ),
  ];
  if (missing.length === 0) return Array.from(byId.values());

  const chunkSize = 200;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('leads')
      .select(LEADS_VENDAS_METRICS_SELECT)
      .eq('user_id', userId)
      .in('id', chunk);
    if (error) throw error;
    for (const row of data || []) byId.set(leadVendaLeadPk(row.id), row);
  }
  return Array.from(byId.values());
}

/** Todas as vendas do usuário (para lista sem filtro de período). Paginado. */
export async function fetchAllLeadVendasForUser(supabase, userId, pageSize = 1000) {
  const all = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(LEAD_VENDAS_TABLE)
      .select('valor_total, data_venda, lead_id, leads(status, vendedor, product_id, nome, whatsapp, email)')
      .eq('user_id', userId)
      .range(offset, offset + pageSize - 1);

    if (error) {
      if (isLeadVendasTableMissing(error)) {
        return { rows: [], usedTable: false };
      }
      throw error;
    }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return { rows: all, usedTable: true };
}

export async function fetchLeadVendasForListTotals(
  supabase,
  userId,
  filters,
  settings,
  searchTerm,
  productIds = null
) {
  const bounds = getLeadsFilterDateBounds(filters);
  const pageSize = 1000;
  const all = [];
  let offset = 0;

  for (;;) {
    let q = supabase
      .from(LEAD_VENDAS_TABLE)
      .select('valor_total, data_venda, lead_id, leads(status, vendedor, product_id, nome, whatsapp, email)')
      .eq('user_id', userId);
    if (bounds) {
      q = q
        .gte('data_venda', toDateOnlyString(bounds.start))
        .lte('data_venda', toDateOnlyString(bounds.end));
    }
    const { data, error } = await q.order('data_venda', { ascending: false }).range(offset, offset + pageSize - 1);

    if (error) {
      if (isLeadVendasTableMissing(error)) {
        return { usedTable: false, rows: [] };
      }
      throw error;
    }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  if (all.length === 0) {
    const totalNoBanco = await countUserLeadVendas(supabase, userId);
    if (totalNoBanco === 0) {
      return { usedTable: false, rows: [] };
    }
  }

  let rows = filterLeadVendaRowsForList(all, filters, settings, searchTerm);
  if (filters?.product) {
    if (productIds && productIds.length > 0) {
      const idSet = new Set(productIds);
      rows = rows.filter((r) => r.leads && idSet.has(r.leads.product_id));
    } else {
      rows = [];
    }
  }

  return { usedTable: true, rows };
}

/** Aplica filtro de status de venda (vendas_agrupadas) com settings reais. */
export function filterLeadVendaRowsForList(rows, filters, settings, searchTerm) {
  const vendaStatuses = getVendaStatuses(settings);
  return rows.filter((row) => {
    const L = row.leads;
    if (!L) return false;
    if (filters?.status && filters.status !== 'todos') {
      if (filters.status === 'vendas_agrupadas') {
        if (!isVendaStatus(L.status, vendaStatuses)) return false;
      } else if (L.status !== filters.status) {
        return false;
      }
    }
    if (filters?.vendedor && filters.vendedor !== 'todos' && L.vendedor !== filters.vendedor) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const parts = searchTerm.split(' ').map((p) => p.trim()).filter(Boolean);
      const nameOk =
        parts.length === 0 ||
        parts.every((part) => (L.nome || '').toLowerCase().includes(part.toLowerCase()));
      const wa = (L.whatsapp || '').toLowerCase().includes(q);
      const em = (L.email || '').toLowerCase().includes(q);
      if (!nameOk && !wa && !em) return false;
    }
    return true;
  });
}

export function sumValorFromLeadVendaRows(rows) {
  const withVal = rows.filter((r) => hasValidValor(r.valor_total));
  const totalVendas = withVal.reduce((s, r) => s + (Number(r.valor_total) || 0), 0);
  const count = withVal.length;
  const ticketMedio = count > 0 ? totalVendas / count : 0;
  return { totalVendas, ticketMedio, count };
}

/** Dashboard: métricas de vendas a partir de lead_vendas (já filtradas por data_venda no fetch). */
export function dashboardMetricsFromLeadVendas(rows, leadsInRangeByEntrada) {
  const entradaIds = new Set((leadsInRangeByEntrada || []).map((l) => l.id));
  const valorTotal = rows.reduce((s, r) => s + (Number(r.valor_total) || 0), 0);
  const vendas = rows.length;
  const vendasFunil = rows.filter((r) => entradaIds.has(r.lead_id)).length;
  return { valorTotal, vendas, vendasFunil };
}

/**
 * lead_vendas no período + leads com venda no período. Valor no cadastro do lead tem prioridade
 * quando há uma única linha na tabela para o lead. Várias linhas (várias vendas) somam todas.
 */
export function mergeDashboardVendasTableWithLeadsFallback(vRows, dm) {
  const entradaIds = new Set((dm.leadsInRangeByEntrada || []).map((l) => leadVendaLeadPk(l.id)));
  const vendasLeads = dm.leadsVendasNoPeriodo || [];

  const leadMap = new Map();
  for (const l of dm.leadsInRangeByEntrada || []) {
    leadMap.set(leadVendaLeadPk(l.id), l);
  }
  for (const l of vendasLeads) {
    const pk = leadVendaLeadPk(l.id);
    if (!leadMap.has(pk)) leadMap.set(pk, l);
  }

  const byLeadPk = new Map();
  for (const r of vRows || []) {
    const pk = leadVendaLeadPk(r.lead_id);
    if (!pk) continue;
    if (!byLeadPk.has(pk)) byLeadPk.set(pk, []);
    byLeadPk.get(pk).push(r);
  }

  let valorTotal = 0;
  let vendas = 0;
  let vendasFunil = 0;

  for (const [pk, rows] of byLeadPk) {
    const lead = leadMap.get(pk);
    const vLead = lead ? Number(lead.valor) || 0 : 0;
    if (rows.length === 1) {
      const vRow = Number(rows[0].valor_total) || 0;
      valorTotal += vLead > 0 ? vLead : vRow;
      vendas += 1;
    } else {
      for (const r of rows) {
        valorTotal += Number(r.valor_total) || 0;
        vendas += 1;
      }
    }
    if (entradaIds.has(pk)) vendasFunil += rows.length;
  }

  for (const lead of vendasLeads) {
    const pk = leadVendaLeadPk(lead.id);
    if (byLeadPk.has(pk)) continue;
    valorTotal += Number(lead.valor) || 0;
    vendas += 1;
    if (entradaIds.has(pk)) vendasFunil += 1;
  }

  return { vendas, vendasFunil, valorTotal };
}

/** Mesma regra no Dashboard e em Relatórios (evita RPC ≠ cliente quando lead_vendas não está ativa). */
export function vendasTotaisAlinhados(vRows, usedTable, dm) {
  if (usedTable) {
    return mergeDashboardVendasTableWithLeadsFallback(vRows, dm);
  }
  return {
    vendas: dm.vendas,
    vendasFunil: dm.vendasFunil,
    valorTotal: dm.valorTotal,
  };
}

/** Fallback: leads com status venda + data (custom_date_field / entrada) no período. */
export function dashboardMetricsFromLeads(allLeads, settings, rangeFrom, rangeTo) {
  const vendaStatuses = getVendaStatuses(settings);
  const isVendaLead = (l) => isVendaStatus(l.status, vendaStatuses);

  const leadsInRangeByEntrada = allLeads.filter((lead) => {
    const entrada = parseLeadContactDate(lead);
    return isInRangeInclusive(entrada, rangeFrom, rangeTo);
  });

  const leadsVendasNoPeriodo = allLeads.filter((lead) => {
    if (!isVendaLead(lead)) return false;
    const dataRef = parseLeadSaleOrContactDate(lead);
    return isInRangeInclusive(dataRef, rangeFrom, rangeTo);
  });

  const vendasFunil = leadsInRangeByEntrada.filter((lead) => {
    if (!isVendaLead(lead)) return false;
    const dataRef = parseLeadSaleOrContactDate(lead);
    return isInRangeInclusive(dataRef, rangeFrom, rangeTo);
  }).length;

  const valorTotal = leadsVendasNoPeriodo.reduce((s, l) => s + (Number(l.valor) || 0), 0);

  return {
    leadsInRangeByEntrada,
    leadsVendasNoPeriodo,
    vendas: leadsVendasNoPeriodo.length,
    vendasFunil,
    valorTotal,
  };
}

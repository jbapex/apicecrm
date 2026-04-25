import { format } from 'date-fns';
import { getVendaStatuses, isVendaStatus, hasValidValor } from '@/lib/vendaMetrics.js';
import { parseLeadSaleOrContactDate } from '@/lib/leadSaleDate.js';
import { isLeadVendasTableMissing, LEAD_VENDAS_TABLE } from '@/lib/vendasAggregation.js';

/**
 * Mantém `lead_vendas` alinhado ao lead após salvar na gestão:
 * — status de venda + valor válido + data (custom_date_field ou data_entrada) → uma linha na tabela;
 * — caso contrário → remove linhas desse lead (evita métricas fantasmas).
 */
export async function syncLeadVendaFromLead(supabase, userId, lead, settings) {
  if (!supabase || !userId || !lead?.id) return { ok: true, skipped: true };

  const vendaStatuses = getVendaStatuses(settings);
  const isSale = isVendaStatus(lead.status, vendaStatuses) && hasValidValor(lead.valor);
  const saleDate = isSale ? parseLeadSaleOrContactDate(lead) : null;

  const { error: delErr } = await supabase
    .from(LEAD_VENDAS_TABLE)
    .delete()
    .eq('lead_id', lead.id)
    .eq('user_id', userId);

  if (delErr) {
    if (isLeadVendasTableMissing(delErr)) return { ok: true, skipped: true };
    console.warn('lead_vendas delete', delErr);
    return { ok: false, error: delErr };
  }

  if (!isSale || !saleDate) {
    return { ok: true };
  }

  const dataVenda = format(saleDate, 'yyyy-MM-dd');
  const { error: insErr } = await supabase.from(LEAD_VENDAS_TABLE).insert({
    user_id: userId,
    lead_id: lead.id,
    data_venda: dataVenda,
    valor_total: Number(lead.valor) || 0,
  });

  if (insErr) {
    if (isLeadVendasTableMissing(insErr)) return { ok: true, skipped: true };
    console.warn('lead_vendas insert', insErr);
    return { ok: false, error: insErr };
  }

  return { ok: true };
}

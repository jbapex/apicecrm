-- Vendas registradas na gestão de leads (CRM Ápice).
-- Fonte oficial para valor + data de venda nas métricas quando houver linhas aqui.
-- Execute no SQL Editor do projeto Supabase do CRM se ainda não aplicou migrações via CLI.

CREATE TABLE IF NOT EXISTS public.lead_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  data_venda date NOT NULL,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_vendas_user_data ON public.lead_vendas (user_id, data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_lead_vendas_lead ON public.lead_vendas (lead_id);

ALTER TABLE public.lead_vendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_vendas_own" ON public.lead_vendas;
CREATE POLICY "lead_vendas_own"
  ON public.lead_vendas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.lead_vendas IS 'Vendas por lead; métricas somam valor_total por data_venda.';
COMMENT ON COLUMN public.lead_vendas.data_venda IS 'Data da venda (critério de período nas telas).';

-- Opcional: popular a partir de leads já marcados como venda (ajuste status se necessário)
-- INSERT INTO public.lead_vendas (user_id, lead_id, data_venda, valor_total)
-- SELECT l.user_id, l.id,
--   COALESCE((l.custom_date_field::text)::date, (l.data_entrada::text)::date),
--   COALESCE(l.valor, 0)::numeric(14,2)
-- FROM public.leads l
-- WHERE l.valor IS NOT NULL AND l.valor > 0
--   AND l.custom_date_field IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM public.lead_vendas v WHERE v.lead_id = l.id AND v.data_venda = COALESCE((l.custom_date_field::text)::date, (l.data_entrada::text)::date));

-- Execute no Supabase do CRM-Apice (Dashboard → SQL Editor) para o Webhook Genérico funcionar.
-- Tabela de eventos recebidos pelo Webhook Genérico (Integrações).

CREATE TABLE IF NOT EXISTS public.generic_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'webhook_event',
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generic_webhook_events_user_created
  ON public.generic_webhook_events (user_id, created_at DESC);

ALTER TABLE public.generic_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generic_webhook_events_user_own" ON public.generic_webhook_events;
CREATE POLICY "generic_webhook_events_user_own"
  ON public.generic_webhook_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coluna do segredo do webhook genérico em user_settings (se a tabela já existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'generic_webhook_secret') THEN
      ALTER TABLE public.user_settings ADD COLUMN generic_webhook_secret text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'inbox_source') THEN
      ALTER TABLE public.user_settings ADD COLUMN inbox_source text DEFAULT 'generic';
    END IF;
  END IF;
END $$;

-- Realtime (opcional): para a lista de eventos atualizar em tempo real na tela
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'generic_webhook_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.generic_webhook_events;
  END IF;
END $$;

COMMENT ON TABLE public.generic_webhook_events IS 'Eventos recebidos pelo Webhook Genérico (Integrações). Ex.: encaminhamento do Planeje Canais.';

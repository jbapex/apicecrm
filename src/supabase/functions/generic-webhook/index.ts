/**
 * Webhook genérico: recebe eventos de qualquer sistema (ex.: Planeje Canais) e grava em generic_webhook_events.
 * Se inbox_source === 'generic', eventos planeje_whatsapp viram lead na Caixa de Entrada (staged_leads).
 * URL: POST https://<projeto>.supabase.co/functions/v1/generic-webhook?user_id=UUID&secret=SECRET
 * Body: { "event_type": "string", "payload": { ... } }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10 || cleaned.length === 11) cleaned = '55' + cleaned;
  if (cleaned.startsWith('550')) cleaned = '55' + cleaned.substring(3);
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const secret = url.searchParams.get('secret');

    if (!userId || !secret) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros user_id e secret são obrigatórios na URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: { event_type?: string; payload?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body deve ser JSON válido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('generic_webhook_secret, inbox_source')
      .eq('user_id', userId)
      .single();

    if (settingsError || !userSettings || userSettings.generic_webhook_secret !== secret) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Verifique user_id e secret.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventType = typeof body.event_type === 'string' && body.event_type.trim()
      ? body.event_type.trim()
      : 'webhook_event';
    const payload = body.payload !== undefined ? body.payload : body;

    const { error: insertError } = await supabaseAdmin
      .from('generic_webhook_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        payload: payload,
      });

    if (insertError) {
      console.error('[generic-webhook] insert error', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gravar evento.', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se Webhook Genérico é a fonte da caixa de entrada e o evento é do Planeje (WhatsApp), criar staged_lead.
    // Em try/catch para não devolver 500 e impedir o evento de aparecer em Integrações se a tabela staged_leads falhar.
    try {
      const inboxSource = (userSettings as { inbox_source?: string }).inbox_source;
      if (inboxSource === 'generic' && eventType === 'planeje_whatsapp' && payload && typeof payload === 'object') {
        const p = payload as Record<string, unknown>;
        const phone = normalizePhoneNumber((p.phone ?? p.from_jid ?? '') as string);
        const senderName = (p.sender_name ?? '') as string;
        const createdAt = (p.created_at ?? new Date().toISOString()) as string;

        if (phone) {
          const { data: existing } = await supabaseAdmin
            .from('staged_leads')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp', phone)
            .maybeSingle();

          if (!existing) {
            const isMetaAds = p.origin_source === 'meta_ads';
            const sourceLabel = (p.source === 'uazapi' || p.source === 'apicebot') ? 'WhatsApp (Planeje)' : 'Webhook Genérico';
            const origem = isMetaAds ? 'Meta Ads' : sourceLabel;
            const subOrigem = isMetaAds ? 'Pago' : null;
            const profilePic = (typeof p.profile_pic_url === 'string' && p.profile_pic_url.trim()) || (typeof p.imagePreview === 'string' && p.imagePreview.trim()) || null;
            const stagedLead: Record<string, unknown> = {
              user_id: userId,
              nome: toTitleCase(senderName?.trim() || 'Contato'),
              whatsapp: phone,
              email: null,
              origem,
              sub_origem: subOrigem,
              data_recebimento: createdAt,
              status: 'new',
              payload: payload,
            };
            if (profilePic) stagedLead.profile_pic_url = profilePic;
            const { error: leadErr } = await supabaseAdmin.from('staged_leads').insert(stagedLead);
            if (leadErr && leadErr.code !== '23505') {
              console.error('[generic-webhook] staged_leads insert error', leadErr);
            }
          }
        }
      }
    } catch (inboxErr) {
      console.error('[generic-webhook] caixa de entrada (staged_lead) falhou, evento já gravado em generic_webhook_events', inboxErr);
    }

    return new Response(
      JSON.stringify({ success: true, event_type: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[generic-webhook] error', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno.', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

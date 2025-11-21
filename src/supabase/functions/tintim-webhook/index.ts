import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  if (cleaned.startsWith('550')) {
    cleaned = '55' + cleaned.substring(3);
  }
  return cleaned;
}

function parseAndFormatTintimDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return new Date().toISOString();
  }
  // Exemplo: "2025-08-18 às 08:00:15"
  // Esta função precisa ser robusta para lidar com os formatos do JS Date.
  // O formato 'yyyy-MM-dd às HH:mm:ss' não é padrão.
  const formattedString = dateString.replace(' às ', 'T');
  try {
    // Adicionar 'Z' para indicar que é UTC se não houver fuso horário
    // Isso evita que o new Date() interprete como horário local do servidor.
    const date = new Date(formattedString.endsWith('Z') ? formattedString : formattedString + 'Z'); 
    if (isNaN(date.getTime())) {
      // Se a primeira tentativa falhar, tenta sem o Z, deixando o sistema interpretar
       const localDate = new Date(formattedString);
       if (isNaN(localDate.getTime())) {
         return new Date().toISOString(); // Fallback
       }
       return localDate.toISOString();
    }
    return date.toISOString();
  } catch (e) {
    console.error('Error parsing date:', dateString, e);
    return new Date().toISOString();
  }
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
      return new Response(JSON.stringify({ error: 'Parâmetros de usuário ou segredo ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('tintim_webhook_secret, inbox_source')
      .eq('user_id', userId)
      .single();

    if (settingsError || !userSettings || userSettings.tintim_webhook_secret !== secret) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventId = payload.id || crypto.randomUUID();

    // First, save the raw event to tintim_messages
    const { error: eventInsertError } = await supabaseAdmin
      .from('tintim_messages')
      .insert({
        user_id: userId,
        event_id: eventId,
        payload: payload,
      });

    if (eventInsertError && eventInsertError.code !== '23505') { // Ignore duplicate errors
        console.error('Error inserting Tintim event:', eventInsertError);
    }
    
    if (userSettings.inbox_source === 'tintim') {
        const leadData = payload.lead || {};
        const name = leadData.name;
        const phone = leadData.phone;
        const email = leadData.email;
        const source = leadData.source;
        const createdDate = payload.created; // "2025-08-18 às 08:00:15"

        if (!name && !phone) {
            return new Response(JSON.stringify({ error: 'Payload inválido. Nome ou telefone são obrigatórios.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        const normalizedPhone = normalizePhoneNumber(phone);
        
        const { data: existingStagedLead } = await supabaseAdmin
            .from('staged_leads')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp', normalizedPhone)
            .in('status', ['new', 'updated'])
            .maybeSingle();

        if (existingStagedLead) {
             return new Response(JSON.stringify({ message: 'Lead já existe na caixa de entrada. Ignorando.' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        const stagedLead = {
            user_id: userId,
            nome: toTitleCase(name),
            whatsapp: normalizedPhone,
            email: email ? email.toLowerCase() : null,
            origem: source || null,
            data_recebimento: parseAndFormatTintimDate(createdDate),
            status: 'new',
            payload: payload
        };
        
        const { error: insertError } = await supabaseAdmin
            .from('staged_leads')
            .insert(stagedLead);

        if (insertError) {
            throw insertError;
        }

        return new Response(JSON.stringify({ message: 'Lead adicionado à caixa de entrada.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    }

    return new Response(JSON.stringify({ message: 'Evento Tintim recebido e arquivado.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });


  } catch (error) {
    console.error('Erro no webhook Tintim:', error.message);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

interface Payload {
  user_id?: string;
  to?: string;        // explicit phone (E.164, no +)
  title?: string;
  body?: string;
  link?: string;
  message?: string;   // overrides title/body
}

const normalize = (raw: string) => raw.replace(/[^\d]/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!TOKEN || !PHONE_ID) {
      return new Response(JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = (await req.json()) as Payload;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let phone = payload.to ? normalize(payload.to) : '';
    let userId = payload.user_id ?? null;
    let optIn = true;

    if (userId && !phone) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('whatsapp_number, whatsapp_opt_in, phone')
        .eq('id', userId)
        .maybeSingle();
      optIn = prof?.whatsapp_opt_in ?? true;
      const raw = prof?.whatsapp_number || prof?.phone || '';
      phone = normalize(raw);
    }

    const message = payload.message
      ?? [payload.title, payload.body, payload.link ? `\nLink: ${payload.link}` : '']
          .filter(Boolean).join('\n');

    if (!phone || phone.length < 8) {
      await supabase.from('whatsapp_logs').insert({
        user_id: userId, phone, title: payload.title, body: payload.body, link: payload.link,
        status: 'skipped', error: 'no_phone',
      });
      return new Response(JSON.stringify({ skipped: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!optIn) {
      await supabase.from('whatsapp_logs').insert({
        user_id: userId, phone, title: payload.title, body: payload.body, link: payload.link,
        status: 'skipped', error: 'opted_out',
      });
      return new Response(JSON.stringify({ skipped: 'opted_out' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const waRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });

    const waJson = await waRes.json();
    const success = waRes.ok && waJson?.messages?.[0]?.id;

    await supabase.from('whatsapp_logs').insert({
      user_id: userId,
      phone,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      status: success ? 'sent' : 'failed',
      provider_message_id: waJson?.messages?.[0]?.id ?? null,
      error: success ? null : JSON.stringify(waJson?.error ?? waJson),
    });

    // Fallback: in-app notification if WhatsApp failed
    if (!success && userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: payload.title ?? 'Notification',
        body: payload.body ?? null,
        link: payload.link ?? null,
      });
    }

    return new Response(JSON.stringify({ success, response: waJson }), {
      status: success ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-whatsapp error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

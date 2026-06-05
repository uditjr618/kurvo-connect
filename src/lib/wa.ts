import { supabase } from '@/integrations/supabase/client';

/** Normalize to digits-only (no +). */
export const cleanPhone = (raw?: string | null) => (raw || '').replace(/[^\d]/g, '');

/** Open a WhatsApp chat with a given phone (and optional prefilled message). */
export const openWhatsAppChat = (phone?: string | null, message?: string) => {
  const num = cleanPhone(phone);
  if (!num) return false;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  window.open(`https://wa.me/${num}${text}`, '_blank', 'noopener,noreferrer');
  return true;
};

/** Send a WhatsApp message via the server edge function (uses Meta Cloud API). */
export const sendWhatsApp = async (input: {
  user_id?: string; to?: string; title?: string; body?: string; link?: string; message?: string;
}) => {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', { body: input });
  return { data, error };
};

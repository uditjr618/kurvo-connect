import { supabase } from '@/integrations/supabase/client';

/** Add reward points to a user and log a transaction */
export async function awardPoints(userId: string, amount: number, description: string) {
  // Fetch current points
  const { data: prof } = await supabase.from('profiles').select('points').eq('id', userId).single();
  const newPoints = (prof?.points ?? 0) + amount;
  await supabase.from('profiles').update({ points: newPoints }).eq('id', userId);
  await supabase.from('reward_transactions').insert({
    user_id: userId,
    type: amount >= 0 ? 'earn' : 'redeem',
    amount: Math.abs(amount),
    description,
  });
  return newPoints;
}

/** Create a notification for a user */
export async function notify(userId: string, title: string, body?: string, link?: string) {
  // Note: insert policy requires auth.uid() = user_id, so this only works for self-notifications.
  // For cross-user notifications use a SECURITY DEFINER edge function or RPC.
  await supabase.from('notifications').insert({ user_id: userId, title, body, link });
}

/** Notify self (works under RLS) */
export async function notifySelf(title: string, body?: string, link?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').insert({ user_id: user.id, title, body, link });
}

import { supabase } from '@/integrations/supabase/client';

export type EarnAction =
  | 'bill_upload'
  | 'product_code'
  | 'qr_scan'
  | 'plumber_complete'
  | 'order_delivered'
  | 'requirement_fulfilled';

/** Server-validated points earn. Returns amount credited. */
export async function earnPoints(action: EarnAction) {
  const { data, error } = await (supabase as any).rpc('earn_points', { _action: action });
  if (error) throw error;
  return data as number;
}

/** Server-validated reward redemption. */
export async function redeemReward(rewardId: string) {
  const { error } = await (supabase as any).rpc('redeem_reward', { _reward_id: rewardId });
  if (error) throw error;
}

/** Create an in-app notification for the current user (server-validated). */
export async function notifySelf(title: string, body?: string, link?: string) {
  const { error } = await (supabase as any).rpc('notify_self', {
    _title: title,
    _body: body ?? null,
    _link: link ?? null,
  });
  if (error) console.warn('notify_self failed', error.message);
}

/** Look up display names + avatars for a set of user IDs (safe public fields). */
export async function getProfileBasics(ids: string[]) {
  if (ids.length === 0) return new Map<string, { full_name: string; avatar_url: string | null }>();
  const { data } = await (supabase as any).rpc('get_profile_basics', { _ids: ids });
  const m = new Map<string, { full_name: string; avatar_url: string | null }>();
  (data ?? []).forEach((p: any) => m.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url }));
  return m;
}

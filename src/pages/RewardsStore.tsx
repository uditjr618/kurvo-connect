import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { redeemReward, notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Reward { id: string; title: string; description: string | null; points_cost: number; }

const RewardsStore = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('rewards').select('*').eq('is_active', true).order('points_cost').then(({ data }) => setRewards((data as Reward[]) ?? []));
  }, []);

  const redeem = async (r: Reward) => {
    if (!user || !profile) return;
    if (profile.points < r.points_cost) return toast.error('Not enough points');
    setBusy(r.id);
    try {
      await redeemReward(r.id);
      await notifySelf('Reward Redeemed', r.title);
      await refreshProfile();
      toast.success(`Redeemed ${r.title}!`);
    } catch (e: any) {
      toast.error(e?.message || 'Redeem failed');
    } finally { setBusy(null); }
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Rewards Store</h1>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Star size={14}/> {profile?.points ?? 0} points
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 pb-4">
          {rewards === null ? Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-44 rounded-2xl"/>) :
            rewards.map((r, i) => {
              const can = (profile?.points ?? 0) >= r.points_cost;
              return (
                <motion.div key={r.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="rounded-2xl border bg-card p-4 flex flex-col">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-accent text-accent-foreground"><Gift size={24}/></div>
                  <p className="mt-3 font-semibold text-sm leading-tight">{r.title}</p>
                  {r.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="mt-3 mb-2 flex items-center gap-1 text-sm font-bold text-primary">
                    <Star size={12}/> {r.points_cost}
                  </div>
                  <Button size="sm" disabled={!can || busy === r.id} onClick={() => redeem(r)} className="mt-auto gradient-primary border-0 text-primary-foreground">
                    {busy === r.id ? '…' : can ? 'Redeem' : 'Locked'}
                  </Button>
                </motion.div>
              );
            })
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default RewardsStore;

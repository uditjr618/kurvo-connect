import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Txn { id: string; type: string; amount: number; description: string | null; created_at: string; }

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [txns, setTxns] = useState<Txn[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('reward_transactions').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setTxns((data as Txn[]) ?? []));
  }, [user]);

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16} />Back</button>
        <h1 className="text-2xl font-bold">Wallet</h1>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl gradient-hero p-6 text-primary-foreground shadow-xl">
          <div className="flex items-center gap-3">
            <WalletIcon size={24} />
            <p className="text-sm opacity-80">Balance</p>
          </div>
          <p className="mt-2 text-4xl font-extrabold">{profile?.points.toLocaleString() ?? 0} <span className="text-base font-medium opacity-80">points</span></p>
        </motion.div>

        <h2 className="mt-7 mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transactions</h2>

        <div className="space-y-2 pb-4">
          {txns === null ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16 rounded-xl" />) :
            txns.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No transactions yet — start earning!</p> :
            txns.map((t,i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.03 }} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.type === 'earn' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                  {t.type === 'earn' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.description ?? t.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                </div>
                <p className={`font-semibold ${t.type === 'earn' ? 'text-accent' : 'text-destructive'}`}>{t.type === 'earn' ? '+' : '-'}{t.amount}</p>
              </motion.div>
            ))
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default WalletPage;

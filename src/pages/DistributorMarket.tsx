import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { awardPoints, notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Requirement { id: string; retailer_id: string; product_name: string; quantity: number; urgency: string; status: string; notes: string | null; distributor_id: string | null; }

const DistributorMarket = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [reqs, setReqs] = useState<Requirement[] | null>(null);
  const [retailerNames, setRetailerNames] = useState<Record<string,string>>({});

  const load = async () => {
    const { data } = await supabase.from('requirements').select('*').order('created_at',{ascending:false});
    const list = (data as Requirement[]) ?? [];
    setReqs(list);
    // Fetch names
    const ids = [...new Set(list.map(r => r.retailer_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      const map: Record<string,string> = {};
      (profs ?? []).forEach(p => { map[p.id] = p.full_name; });
      setRetailerNames(map);
    }
  };

  useEffect(() => { load(); }, []);

  const accept = async (id: string) => {
    if (!user) return;
    await supabase.from('requirements').update({ status: 'accepted', distributor_id: user.id }).eq('id', id);
    toast.success('Accepted!'); load();
  };
  const fulfill = async (id: string) => {
    if (!user) return;
    await supabase.from('requirements').update({ status: 'fulfilled' }).eq('id', id);
    await awardPoints(user.id, 20, 'Requirement fulfilled');
    await notifySelf('+20 points', 'Requirement fulfilled');
    await refreshProfile();
    toast.success('Fulfilled! +20 points'); load();
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Distributor Market</h1>
        <p className="mt-1 text-sm text-muted-foreground">Retailer demand in your area</p>

        <div className="mt-5 space-y-3 pb-4">
          {reqs === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-28 rounded-2xl"/>) :
            reqs.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No requirements posted yet</p> :
            reqs.map((r,i) => (
              <motion.div key={r.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.product_name}</p>
                    <p className="text-xs text-muted-foreground">{retailerNames[r.retailer_id] || 'Retailer'} · Qty {r.quantity}</p>
                    {r.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{r.notes}"</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.urgency==='urgent'?'bg-destructive/10 text-destructive':r.urgency==='normal'?'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400':'bg-secondary text-muted-foreground'}`}>{r.urgency}</span>
                </div>
                <div className="mt-3">
                  {r.status === 'open' && <Button size="sm" onClick={()=>accept(r.id)} className="w-full gradient-primary border-0 text-primary-foreground"><Truck size={14} className="mr-1"/>Accept</Button>}
                  {r.status === 'accepted' && r.distributor_id === user?.id && <Button size="sm" onClick={()=>fulfill(r.id)} className="w-full gradient-accent border-0 text-accent-foreground"><Sparkles size={14} className="mr-1"/>Mark Fulfilled (+20)</Button>}
                  {r.status === 'fulfilled' && <span className="flex items-center gap-1 text-xs text-accent"><Check size={12}/>Fulfilled</span>}
                  {r.status === 'accepted' && r.distributor_id !== user?.id && <span className="text-xs text-muted-foreground">Being handled by another distributor</span>}
                </div>
              </motion.div>
            ))
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default DistributorMarket;

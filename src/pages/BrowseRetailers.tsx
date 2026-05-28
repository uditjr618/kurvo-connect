import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store as StoreIcon, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

interface Retailer { id: string; full_name: string; address: string | null; avatar_url: string | null; }

const BrowseRetailers = () => {
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState<Retailer[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      // Find retailers via products (RLS prevents reading other users' roles directly)
      const { data: prods } = await supabase.from('products').select('retailer_id').not('retailer_id', 'is', null);
      const ids = Array.from(new Set((prods ?? []).map(p => p.retailer_id as string)));
      if (ids.length === 0) { setRetailers([]); return; }
      const { data: profs } = await supabase.from('profiles').select('id, full_name, address, avatar_url').in('id', ids);
      setRetailers((profs as Retailer[]) ?? []);
    })();
  }, []);

  const filtered = (retailers ?? []).filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Browse Shops</h1>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops…" className="mt-3 h-11" />

        <div className="mt-5 space-y-3 pb-4">
          {retailers === null ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-20 rounded-2xl"/>) :
            filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <StoreIcon className="mx-auto mb-2 text-muted-foreground" size={32}/>
                <p className="text-sm text-muted-foreground">No retailers found yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Sign up as a Retailer and add products to appear here!</p>
              </div>
            ) :
            filtered.map((r, i) => (
              <motion.button key={r.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} onClick={() => navigate(`/shop/${r.id}`)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left hover:border-primary/40 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><StoreIcon size={20}/></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.full_name}</p>
                  {r.address && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate"><MapPin size={11}/>{r.address}</p>}
                </div>
              </motion.button>
            ))
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default BrowseRetailers;

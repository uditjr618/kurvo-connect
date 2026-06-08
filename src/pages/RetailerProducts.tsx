import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Product { id: string; name: string; description: string | null; price: number; stock: number; image_url: string | null; is_available: boolean; }

const RetailerProducts = () => {
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    if (!shopId) return;
    (supabase as any).rpc('get_profile_basics', { _ids: [shopId] })
      .then(({ data }: any) => setShopName(data?.[0]?.full_name ?? 'Shop'));
    supabase.from('products').select('*').eq('retailer_id', shopId).eq('is_available', true).then(({ data }) => setProducts((data as Product[]) ?? []));
  }, [shopId]);

  const addToCart = async (productId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('carts').select('quantity').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
    if (existing) {
      await supabase.from('carts').update({ quantity: existing.quantity + 1 }).eq('user_id', user.id).eq('product_id', productId);
    } else {
      await supabase.from('carts').insert({ user_id: user.id, product_id: productId, quantity: 1 });
    }
    toast.success('Added to cart');
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
          <Button variant="outline" size="sm" onClick={() => navigate('/cart')}><ShoppingCart size={14} className="mr-1"/>Cart</Button>
        </div>
        <h1 className="text-2xl font-bold">{shopName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Products available for delivery or pickup</p>

        <div className="mt-5 space-y-3 pb-4">
          {products === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>) :
            products.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No products available</p> :
            products.map((p, i) => (
              <motion.div key={p.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="flex gap-3 rounded-2xl border bg-card p-4">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full rounded-xl object-cover"/> : <span className="text-2xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {p.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                  <p className="mt-1 font-bold text-primary">₹{Number(p.price).toFixed(0)}</p>
                </div>
                <Button size="sm" onClick={() => addToCart(p.id)} className="self-center gradient-primary border-0 text-primary-foreground"><Plus size={14}/></Button>
              </motion.div>
            ))
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default RetailerProducts;

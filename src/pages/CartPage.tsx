import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CartLine { id: string; product_id: string; quantity: number; product: { id: string; name: string; price: number; retailer_id: string | null; image_url: string | null; }; }

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('carts')
      .select('id, product_id, quantity, product:products(id, name, price, retailer_id, image_url)')
      .eq('user_id', user.id);
    setLines((data as unknown as CartLine[]) ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const updateQty = async (id: string, delta: number, current: number) => {
    const next = current + delta;
    if (next <= 0) { await supabase.from('carts').delete().eq('id', id); }
    else { await supabase.from('carts').update({ quantity: next }).eq('id', id); }
    load();
  };

  const total = (lines ?? []).reduce((s, l) => s + Number(l.product.price) * l.quantity, 0);

  const checkout = async () => {
    if (!user || !lines || lines.length === 0) return;
    if (deliveryType === 'delivery' && !address.trim()) return toast.error('Please enter delivery address');
    setBusy(true);
    try {
      // Group by retailer
      const grouped = new Map<string, CartLine[]>();
      lines.forEach(l => {
        const rid = l.product.retailer_id ?? 'unknown';
        grouped.set(rid, [...(grouped.get(rid) ?? []), l]);
      });

      for (const [retailerId, items] of grouped) {
        const orderTotal = items.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0);
        const { data: order, error } = await supabase.from('orders').insert({
          customer_id: user.id,
          retailer_id: retailerId === 'unknown' ? null : retailerId,
          total: orderTotal,
          status: 'pending',
          delivery_type: deliveryType,
          address: deliveryType === 'delivery' ? address : null,
        }).select().single();
        if (error) throw error;
        await supabase.from('order_items').insert(items.map(l => ({
          order_id: order.id, product_id: l.product_id, product_name: l.product.name,
          price: l.product.price, quantity: l.quantity,
        })));
      }

      await supabase.from('carts').delete().eq('user_id', user.id);
      await notifySelf('Order placed', `Total ₹${total.toFixed(0)}`);
      toast.success('Order placed successfully!');
      navigate('/my-orders');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed');
    } finally { setBusy(false); }
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Cart</h1>

        <div className="mt-4 space-y-2">
          {lines === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-20 rounded-xl"/>) :
            lines.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Your cart is empty</p> :
            lines.map(l => (
              <motion.div key={l.id} initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-secondary flex items-center justify-center">
                  {l.product.image_url ? <img src={l.product.image_url} className="h-full w-full rounded-lg object-cover" alt=""/> : <span className="text-xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.product.name}</p>
                  <p className="text-xs text-muted-foreground">₹{Number(l.product.price).toFixed(0)} × {l.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(l.id, -1, l.quantity)} className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary"><Minus size={12}/></button>
                  <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                  <button onClick={() => updateQty(l.id, 1, l.quantity)} className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary"><Plus size={12}/></button>
                  <button onClick={() => updateQty(l.id, -l.quantity, l.quantity)} className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-destructive"><Trash2 size={12}/></button>
                </div>
              </motion.div>
            ))
          }
        </div>

        {lines && lines.length > 0 && (
          <div className="mt-6 space-y-4 rounded-2xl border bg-card p-4">
            <div>
              <Label className="mb-2 block">Delivery method</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['delivery','pickup'] as const).map(t => (
                  <button key={t} onClick={() => setDeliveryType(t)} className={`rounded-xl border-2 p-3 text-sm font-medium capitalize ${deliveryType===t?'border-primary bg-primary/5 text-primary':'border-border'}`}>{t}</button>
                ))}
              </div>
            </div>
            {deliveryType === 'delivery' && (
              <div>
                <Label>Delivery address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, city" className="mt-1.5 h-11"/>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-extrabold">₹{total.toFixed(0)}</span>
            </div>
            <Button disabled={busy} onClick={checkout} className="h-12 w-full gradient-primary border-0 text-primary-foreground font-semibold">{busy?'Placing…':'Place Order'}</Button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default CartPage;

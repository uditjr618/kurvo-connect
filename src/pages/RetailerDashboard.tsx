import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, ClipboardList, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { awardPoints, notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Product { id: string; name: string; price: number; stock: number; description: string | null; is_available: boolean; }
interface Order { id: string; total: number; status: string; created_at: string; address: string | null; delivery_type: string; order_items: { product_name: string; quantity: number }[]; }
interface Requirement { id: string; product_name: string; quantity: number; urgency: string; status: string; notes: string | null; }

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reqs, setReqs] = useState<Requirement[] | null>(null);
  const [pOpen, setPOpen] = useState(false);
  const [rOpen, setROpen] = useState(false);
  const [newP, setNewP] = useState({ name:'', price:'', stock:'', description:'' });
  const [newR, setNewR] = useState({ product_name:'', quantity:'', urgency:'normal', notes:'' });

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: o }, { data: r }] = await Promise.all([
      supabase.from('products').select('*').eq('retailer_id', user.id).order('created_at',{ascending:false}),
      supabase.from('orders').select('*, order_items(product_name, quantity)').eq('retailer_id', user.id).order('created_at',{ascending:false}),
      supabase.from('requirements').select('*').eq('retailer_id', user.id).order('created_at',{ascending:false}),
    ]);
    setProducts((p as Product[]) ?? []);
    setOrders((o as unknown as Order[]) ?? []);
    setReqs((r as Requirement[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const addProduct = async () => {
    if (!user || !newP.name || !newP.price) return toast.error('Name and price required');
    const { error } = await supabase.from('products').insert({
      retailer_id: user.id, name: newP.name, price: Number(newP.price), stock: Number(newP.stock||0), description: newP.description,
    });
    if (error) return toast.error(error.message);
    toast.success('Product added'); setPOpen(false); setNewP({name:'',price:'',stock:'',description:''}); load();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  const addRequirement = async () => {
    if (!user || !newR.product_name || !newR.quantity) return toast.error('Product and quantity required');
    const { error } = await supabase.from('requirements').insert({
      retailer_id: user.id, product_name: newR.product_name, quantity: Number(newR.quantity), urgency: newR.urgency, notes: newR.notes,
    });
    if (error) return toast.error(error.message);
    toast.success('Requirement posted'); setROpen(false); setNewR({product_name:'',quantity:'',urgency:'normal',notes:''}); load();
  };

  const updateOrder = async (id: string, status: string, reward = 0) => {
    if (!user) return;
    await supabase.from('orders').update({ status }).eq('id', id);
    if (reward > 0) { await awardPoints(user.id, reward, `Order ${id.slice(0,8)} delivered`); await notifySelf(`+${reward} points`, 'Order delivered'); await refreshProfile(); }
    toast.success(`Order ${status}`); load();
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">My Shop</h1>

        <Tabs defaultValue="products" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="products"><Package size={14} className="mr-1"/>Products</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag size={14} className="mr-1"/>Orders</TabsTrigger>
            <TabsTrigger value="reqs"><ClipboardList size={14} className="mr-1"/>Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4 space-y-3 pb-4">
            <Dialog open={pOpen} onOpenChange={setPOpen}>
              <DialogTrigger asChild><Button className="w-full gradient-primary border-0 text-primary-foreground"><Plus size={16} className="mr-1"/>Add Product</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={newP.name} onChange={e=>setNewP({...newP, name:e.target.value})} className="mt-1"/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Price (₹)</Label><Input type="number" value={newP.price} onChange={e=>setNewP({...newP, price:e.target.value})} className="mt-1"/></div>
                    <div><Label>Stock</Label><Input type="number" value={newP.stock} onChange={e=>setNewP({...newP, stock:e.target.value})} className="mt-1"/></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={newP.description} onChange={e=>setNewP({...newP, description:e.target.value})} className="mt-1" rows={2}/></div>
                  <Button onClick={addProduct} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
            {products === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-20 rounded-2xl"/>) :
              products.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No products yet. Add your first product!</p> :
              products.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₹{Number(p.price).toFixed(0)} · Stock: {p.stock}</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="text-destructive p-2"><Trash2 size={16}/></button>
                </div>
              ))
            }
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-3 pb-4">
            {orders === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>) :
              orders.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No customer orders yet</p> :
              orders.map(o => (
                <motion.div key={o.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">#{o.id.slice(0,8)} · ₹{Number(o.total).toFixed(0)} · {o.delivery_type}</p>
                  <p className="mt-1 text-sm">{o.order_items.map(i=>`${i.product_name}×${i.quantity}`).join(', ')}</p>
                  {o.address && <p className="text-xs text-muted-foreground mt-0.5">📍 {o.address}</p>}
                  <div className="mt-3 flex gap-2">
                    {o.status==='pending' && <>
                      <Button size="sm" onClick={()=>updateOrder(o.id, 'accepted')} className="flex-1 gradient-primary border-0 text-primary-foreground">Accept</Button>
                      <Button size="sm" variant="outline" onClick={()=>updateOrder(o.id, 'rejected')} className="flex-1">Reject</Button>
                    </>}
                    {o.status==='accepted' && <Button size="sm" onClick={()=>updateOrder(o.id,'delivered',50)} className="w-full gradient-accent border-0 text-accent-foreground"><Sparkles size={14} className="mr-1"/>Mark Delivered (+50)</Button>}
                    {(o.status==='delivered'||o.status==='rejected') && <span className="text-xs text-muted-foreground"><Check size={12} className="inline mr-1"/>{o.status}</span>}
                  </div>
                </motion.div>
              ))
            }
          </TabsContent>

          <TabsContent value="reqs" className="mt-4 space-y-3 pb-4">
            <Dialog open={rOpen} onOpenChange={setROpen}>
              <DialogTrigger asChild><Button className="w-full gradient-primary border-0 text-primary-foreground"><Plus size={16} className="mr-1"/>Post Stock Requirement</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Requirement</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Product</Label><Input value={newR.product_name} onChange={e=>setNewR({...newR, product_name:e.target.value})} className="mt-1"/></div>
                  <div><Label>Quantity</Label><Input type="number" value={newR.quantity} onChange={e=>setNewR({...newR, quantity:e.target.value})} className="mt-1"/></div>
                  <div><Label>Urgency</Label>
                    <div className="mt-1 flex gap-2">
                      {['low','normal','urgent'].map(u => <button key={u} onClick={()=>setNewR({...newR,urgency:u})} className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium capitalize ${newR.urgency===u?'border-primary bg-primary/5 text-primary':'border-border'}`}>{u}</button>)}
                    </div>
                  </div>
                  <div><Label>Notes</Label><Textarea value={newR.notes} onChange={e=>setNewR({...newR, notes:e.target.value})} className="mt-1" rows={2}/></div>
                  <Button onClick={addRequirement} className="w-full">Post</Button>
                </div>
              </DialogContent>
            </Dialog>
            {reqs === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-20 rounded-2xl"/>) :
              reqs.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No requirements yet</p> :
              reqs.map(r => (
                <div key={r.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.product_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.urgency==='urgent'?'bg-destructive/10 text-destructive':r.urgency==='normal'?'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400':'bg-secondary text-muted-foreground'}`}>{r.urgency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {r.quantity} · {r.status}</p>
                </div>
              ))
            }
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
};

export default RetailerDashboard;

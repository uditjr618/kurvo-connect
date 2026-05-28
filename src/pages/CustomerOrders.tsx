import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

interface Order { id: string; total: number; status: string; delivery_type: string; created_at: string; order_items: { product_name: string; quantity: number }[]; }
interface Booking { id: string; service_type: string; location: string; status: string; scheduled_date: string | null; created_at: string; }

const CustomerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*, order_items(product_name, quantity)').eq('customer_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as unknown as Order[]) ?? []));
    supabase.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setBookings((data as Booking[]) ?? []));
  }, [user]);

  const statusBadge = (s: string) => `rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
    s==='pending'?'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400':
    s==='accepted'?'bg-blue-500/10 text-blue-700 dark:text-blue-400':
    s==='delivered'||s==='completed'?'bg-accent/10 text-accent':'bg-destructive/10 text-destructive'
  }`;

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">My Orders</h1>

        <Tabs defaultValue="orders" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="orders"><Package size={14} className="mr-1.5"/>Orders</TabsTrigger>
            <TabsTrigger value="bookings"><Wrench size={14} className="mr-1.5"/>Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4 space-y-3 pb-4">
            {orders === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>) :
              orders.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No orders yet</p> :
              orders.map((o, i) => (
                <motion.div key={o.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">#{o.id.slice(0,8)} · {o.delivery_type}</p>
                      <p className="mt-1 text-sm font-medium">{o.order_items.map(i => `${i.product_name} × ${i.quantity}`).join(', ')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{Number(o.total).toFixed(0)}</p>
                      <span className={statusBadge(o.status)+' mt-1 inline-block'}>{o.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </TabsContent>
          <TabsContent value="bookings" className="mt-4 space-y-3 pb-4">
            {bookings === null ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>) :
              bookings.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No bookings yet</p> :
              bookings.map((b, i) => (
                <motion.div key={b.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="rounded-2xl border bg-card p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{b.service_type}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{b.location}</p>
                    {b.scheduled_date && <p className="mt-0.5 text-xs text-muted-foreground">📅 {b.scheduled_date}</p>}
                  </div>
                  <span className={statusBadge(b.status)}>{b.status}</span>
                </motion.div>
              ))
            }
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
};

export default CustomerOrders;

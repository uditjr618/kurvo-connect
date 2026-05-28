import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Package, ShoppingBag, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [stats, setStats] = useState<{ users:number; products:number; orders:number; bookings:number } | null>(null);

  useEffect(() => {
    (async () => {
      const [u, p, o, b] = await Promise.all([
        supabase.from('profiles').select('*', { count:'exact', head:true }),
        supabase.from('products').select('*', { count:'exact', head:true }),
        supabase.from('orders').select('*', { count:'exact', head:true }),
        supabase.from('bookings').select('*', { count:'exact', head:true }),
      ]);
      setStats({ users: u.count ?? 0, products: p.count ?? 0, orders: o.count ?? 0, bookings: b.count ?? 0 });
    })();
  }, []);

  if (role !== 'admin') return null;

  const cards = [
    { icon: Users, label: 'Users', value: stats?.users, color: 'bg-blue-500/10 text-blue-600' },
    { icon: Package, label: 'Products', value: stats?.products, color: 'bg-accent/10 text-accent' },
    { icon: ShoppingBag, label: 'Orders', value: stats?.orders, color: 'bg-yellow-500/10 text-yellow-600' },
    { icon: Wrench, label: 'Bookings', value: stats?.bookings, color: 'bg-purple-500/10 text-purple-600' },
  ];

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview & management</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="rounded-2xl border bg-card p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}><c.icon size={20}/></div>
              <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
              {stats === null ? <Skeleton className="mt-1 h-7 w-16"/> : <p className="text-2xl font-extrabold">{c.value}</p>}
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="users" className="mt-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersTable/></TabsContent>
          <TabsContent value="orders" className="mt-4"><OrdersTable/></TabsContent>
          <TabsContent value="bookings" className="mt-4"><BookingsTable/></TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
};

const UsersTable = () => {
  const [rows, setRows] = useState<{ id:string; full_name:string; points:number; role?:string }[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, points').limit(100);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const map = new Map((roles ?? []).map(r => [r.user_id, r.role]));
      setRows((profs ?? []).map(p => ({ ...p, role: map.get(p.id) })));
    })();
  }, []);
  if (rows === null) return <Skeleton className="h-40 rounded-xl"/>;
  return <div className="space-y-2 pb-4">{rows.map(r=>(
    <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
      <div><p className="font-medium text-sm">{r.full_name||'—'}</p><p className="text-xs text-muted-foreground capitalize">{r.role||'customer'}</p></div>
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{r.points} pts</span>
    </div>
  ))}</div>;
};

const OrdersTable = () => {
  const [rows, setRows] = useState<{ id:string; total:number; status:string; created_at:string }[] | null>(null);
  useEffect(() => { supabase.from('orders').select('id, total, status, created_at').order('created_at',{ascending:false}).limit(50).then(({data})=>setRows(data??[])); }, []);
  if (rows === null) return <Skeleton className="h-40 rounded-xl"/>;
  return <div className="space-y-2 pb-4">{rows.length===0?<p className="text-center text-sm text-muted-foreground py-8">No orders</p>:rows.map(r=>(
    <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
      <div><p className="text-xs text-muted-foreground">#{r.id.slice(0,8)}</p><p className="font-medium">₹{Number(r.total).toFixed(0)}</p></div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{r.status}</span>
    </div>
  ))}</div>;
};

const BookingsTable = () => {
  const [rows, setRows] = useState<{ id:string; service_type:string; status:string; location:string }[] | null>(null);
  useEffect(() => { supabase.from('bookings').select('id, service_type, status, location').order('created_at',{ascending:false}).limit(50).then(({data})=>setRows(data??[])); }, []);
  if (rows === null) return <Skeleton className="h-40 rounded-xl"/>;
  return <div className="space-y-2 pb-4">{rows.length===0?<p className="text-center text-sm text-muted-foreground py-8">No bookings</p>:rows.map(r=>(
    <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
      <div><p className="font-medium text-sm">{r.service_type}</p><p className="text-xs text-muted-foreground truncate">{r.location}</p></div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{r.status}</span>
    </div>
  ))}</div>;
};

export default AdminPanel;

import { useEffect, useState } from 'react';
import { Users, ShoppingBag, Wrench, Store, Truck, Package, Clock, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface Stats {
  users: number; orders: number; bookings: number; revenue: number;
  retailers: number; distributors: number; pendingOrders: number; products: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderTrend, setOrderTrend] = useState<{ day: string; count: number; revenue: number }[]>([]);
  const [rolePie, setRolePie] = useState<{ name: string; value: number }[]>([]);
  const [recent, setRecent] = useState<{ id: string; type: string; label: string; when: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { count: users },
        { count: orders },
        { count: bookings },
        { count: products },
        { count: pendingOrders },
        { data: revenueRows },
        { data: roles },
        { data: trendRows },
        { data: recentOrders },
        { data: recentBookings },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total').neq('status', 'rejected'),
        supabase.from('user_roles').select('role'),
        supabase.from('orders').select('created_at, total').gte('created_at', subDays(new Date(), 6).toISOString()),
        supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('id, service_type, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const revenue = (revenueRows ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
      const roleCounts: Record<string, number> = {};
      (roles ?? []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1; });

      setStats({
        users: users ?? 0, orders: orders ?? 0, bookings: bookings ?? 0,
        revenue, products: products ?? 0, pendingOrders: pendingOrders ?? 0,
        retailers: roleCounts.retailer ?? 0, distributors: roleCounts.distributor ?? 0,
      });
      setRolePie(Object.entries(roleCounts).map(([name, value]) => ({ name, value })));

      const byDay: Record<string, { count: number; revenue: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const k = format(subDays(new Date(), i), 'MMM d');
        byDay[k] = { count: 0, revenue: 0 };
      }
      (trendRows ?? []).forEach((r: any) => {
        const k = format(new Date(r.created_at), 'MMM d');
        if (byDay[k]) { byDay[k].count += 1; byDay[k].revenue += Number(r.total ?? 0); }
      });
      setOrderTrend(Object.entries(byDay).map(([day, v]) => ({ day, ...v })));

      const acts = [
        ...(recentOrders ?? []).map((o: any) => ({ id: o.id, type: 'Order', label: `₹${o.total} • ${o.status}`, when: o.created_at })),
        ...(recentBookings ?? []).map((b: any) => ({ id: b.id, type: 'Booking', label: `${b.service_type} • ${b.status}`, when: b.created_at })),
      ].sort((a, b) => b.when.localeCompare(a.when)).slice(0, 8);
      setRecent(acts);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" description="Platform overview & live activity" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats?.users} tint="bg-primary/10 text-primary" delay={0} />
        <StatCard icon={ShoppingBag} label="Orders" value={stats?.orders} hint={`${stats?.pendingOrders ?? 0} pending`} tint="bg-yellow-500/10 text-yellow-600" delay={0.05} />
        <StatCard icon={IndianRupee} label="Revenue" value={stats ? `₹${stats.revenue.toLocaleString()}` : undefined} tint="bg-accent/10 text-accent" delay={0.1} />
        <StatCard icon={Wrench} label="Bookings" value={stats?.bookings} tint="bg-purple-500/10 text-purple-600" delay={0.15} />
        <StatCard icon={Store} label="Retailers" value={stats?.retailers} tint="bg-blue-500/10 text-blue-600" delay={0.2} />
        <StatCard icon={Truck} label="Distributors" value={stats?.distributors} tint="bg-cyan-500/10 text-cyan-600" delay={0.25} />
        <StatCard icon={Package} label="Products" value={stats?.products} tint="bg-pink-500/10 text-pink-600" delay={0.3} />
        <StatCard icon={Clock} label="Pending Orders" value={stats?.pendingOrders} tint="bg-orange-500/10 text-orange-600" delay={0.35} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Orders & Revenue (last 7 days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Orders" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue ₹" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <ul className="divide-y">
              {recent.map((a) => (
                <li key={a.type + a.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">{a.type}</span>
                    <span className="text-sm">{a.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(a.when), 'MMM d, HH:mm')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

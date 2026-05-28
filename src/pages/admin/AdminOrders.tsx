import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Row {
  id: string; customer_id: string; retailer_id: string | null;
  total: number; status: string; delivery_type: string; created_at: string;
  customer_name?: string; retailer_name?: string;
}

const STATUSES = ['pending', 'accepted', 'rejected', 'delivered'];

const AdminOrders = () => {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const ids = Array.from(new Set((data ?? []).flatMap((o: any) => [o.customer_id, o.retailer_id]).filter(Boolean)));
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
    setRows((data ?? []).map((o: any) => ({ ...o, customer_name: m.get(o.customer_id) ?? '—', retailer_name: o.retailer_id ? m.get(o.retailer_id) : '—' })));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (r: Row, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Order updated'); load();
  };
  const remove = async (r: Row) => {
    if (!confirm('Delete this order?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); load();
  };

  const statusColor = (s: string) => s === 'delivered' ? 'bg-accent/10 text-accent'
    : s === 'pending' ? 'bg-yellow-500/10 text-yellow-600'
    : s === 'rejected' ? 'bg-destructive/10 text-destructive'
    : 'bg-primary/10 text-primary';

  return (
    <div>
      <PageHeader title="Orders" description="All marketplace orders" />
      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No orders"
        columns={[
          { header: 'Order', cell: (r) => <span className="font-mono text-xs">#{r.id.slice(0, 8)}</span> },
          { header: 'Customer', cell: (r) => <span>{r.customer_name}</span> },
          { header: 'Retailer', cell: (r) => <span className="text-muted-foreground">{r.retailer_name}</span> },
          { header: 'Total', cell: (r) => <span className="font-mono">₹{r.total}</span> },
          { header: 'Type', cell: (r) => <Badge variant="outline">{r.delivery_type}</Badge> },
          { header: 'Status', cell: (r) => (
            <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
              <SelectTrigger className="h-8 w-32"><Badge className={statusColor(r.status)}>{r.status}</Badge></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          ) },
          { header: 'Date', cell: (r) => <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d')}</span> },
          { header: '', className: 'text-right', cell: (r) => <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 size={15} className="text-destructive"/></Button> },
        ]}
      />
    </div>
  );
};

export default AdminOrders;

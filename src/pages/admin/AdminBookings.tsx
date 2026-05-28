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
  id: string; customer_id: string; plumber_id: string | null;
  service_type: string; status: string; location: string; created_at: string;
  customer_name?: string; plumber_name?: string;
}

const STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

const AdminBookings = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    const ids = Array.from(new Set((data ?? []).flatMap((o: any) => [o.customer_id, o.plumber_id]).filter(Boolean)));
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
    setRows((data ?? []).map((o: any) => ({ ...o, customer_name: m.get(o.customer_id) ?? '—', plumber_name: o.plumber_id ? m.get(o.plumber_id) : 'Unassigned' })));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (r: Row, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Updated'); load();
  };
  const remove = async (r: Row) => {
    if (!confirm('Delete booking?')) return;
    await supabase.from('bookings').delete().eq('id', r.id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <PageHeader title="Bookings" description="All plumber service bookings" />
      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No bookings"
        columns={[
          { header: 'Customer', cell: (r) => r.customer_name },
          { header: 'Plumber', cell: (r) => <span className="text-muted-foreground">{r.plumber_name}</span> },
          { header: 'Service', cell: (r) => <Badge variant="outline">{r.service_type}</Badge> },
          { header: 'Location', cell: (r) => <span className="truncate text-xs">{r.location}</span> },
          { header: 'Status', cell: (r) => (
            <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
              <SelectTrigger className="h-8 w-36"><SelectValue/></SelectTrigger>
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

export default AdminBookings;

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
  id: string; retailer_id: string; distributor_id: string | null;
  product_name: string; quantity: number; urgency: string; status: string; created_at: string;
  retailer_name?: string;
}

const STATUSES = ['open', 'accepted', 'fulfilled', 'cancelled'];

const AdminRequirements = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('requirements').select('*').order('created_at', { ascending: false });
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.retailer_id)));
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
    setRows((data ?? []).map((r: any) => ({ ...r, retailer_name: m.get(r.retailer_id) ?? '—' })));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (r: Row, status: string) => {
    const { error } = await supabase.from('requirements').update({ status }).eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Updated'); load();
  };
  const remove = async (r: Row) => {
    if (!confirm('Delete requirement?')) return;
    await supabase.from('requirements').delete().eq('id', r.id);
    toast.success('Deleted'); load();
  };

  const urgencyColor = (u: string) => u === 'urgent' ? 'bg-destructive/10 text-destructive' : u === 'normal' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground';

  return (
    <div>
      <PageHeader title="Requirements" description="Retailer stock requests for distributors" />
      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No requirements"
        columns={[
          { header: 'Product', cell: (r) => <p className="font-medium">{r.product_name}</p> },
          { header: 'Retailer', cell: (r) => <span className="text-muted-foreground">{r.retailer_name}</span> },
          { header: 'Qty', cell: (r) => <span className="font-mono">{r.quantity}</span> },
          { header: 'Urgency', cell: (r) => <Badge className={urgencyColor(r.urgency)}>{r.urgency}</Badge> },
          { header: 'Status', cell: (r) => (
            <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
              <SelectTrigger className="h-8 w-32"><SelectValue/></SelectTrigger>
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

export default AdminRequirements;

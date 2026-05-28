import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Row {
  id: string; name: string; price: number; stock: number; is_available: boolean;
  retailer_id: string | null; created_at: string;
  retailer_name?: string;
}

const AdminProducts = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('products').select('id, name, price, stock, is_available, retailer_id, created_at').order('created_at', { ascending: false });
    const ids = Array.from(new Set((data ?? []).map((p: any) => p.retailer_id).filter(Boolean)));
    const nameMap = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      (profs ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name));
    }
    setRows((data ?? []).map((p: any) => ({ ...p, retailer_name: p.retailer_id ? nameMap.get(p.retailer_id) : '—' })));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (r: Row) => {
    await supabase.from('products').update({ is_available: !r.is_available }).eq('id', r.id);
    toast.success(r.is_available ? 'Hidden' : 'Listed');
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete ${r.name}?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Product deleted');
    load();
  };

  const filtered = (rows ?? []).filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Products" description="Review and moderate retailer products" />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
      </div>
      <DataTable
        rows={rows === null ? null : filtered}
        keyFn={(r) => r.id}
        emptyText="No products"
        columns={[
          { header: 'Product', cell: (r) => <p className="font-medium">{r.name}</p> },
          { header: 'Retailer', cell: (r) => <span className="text-sm text-muted-foreground">{r.retailer_name}</span> },
          { header: 'Price', cell: (r) => <span className="font-mono">₹{r.price}</span> },
          { header: 'Stock', cell: (r) => <span className="font-mono">{r.stock}</span> },
          { header: 'Status', cell: (r) => r.is_available
              ? <Badge variant="secondary" className="bg-accent/10 text-accent">Listed</Badge>
              : <Badge variant="outline">Hidden</Badge> },
          { header: 'Actions', className: 'text-right', cell: (r) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.is_available ? 'Hide' : 'List'}</Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 size={15} className="text-destructive" /></Button>
            </div>
          ) },
        ]}
      />
    </div>
  );
};

export default AdminProducts;

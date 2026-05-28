import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Row { id: string; name: string; price: number; stock: number; retailer_name?: string; }

const AdminInventory = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('id, name, price, stock, retailer_id').order('stock', { ascending: true });
      const ids = Array.from(new Set((data ?? []).map((p: any) => p.retailer_id).filter(Boolean)));
      const { data: profs } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] };
      const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
      setRows((data ?? []).map((p: any) => ({ ...p, retailer_name: m.get(p.retailer_id) ?? '—' })));
    })();
  }, []);

  const filtered = (rows ?? []).filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const stockBadge = (n: number) => n === 0
    ? <Badge variant="destructive">Out</Badge>
    : n < 5 ? <Badge className="bg-yellow-500/10 text-yellow-600">Low ({n})</Badge>
    : <Badge className="bg-accent/10 text-accent">In stock ({n})</Badge>;

  return (
    <div>
      <PageHeader title="Inventory" description="Stock levels across the platform" />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
      </div>
      <DataTable
        rows={rows === null ? null : filtered} keyFn={(r) => r.id} emptyText="No products"
        columns={[
          { header: 'Product', cell: (r) => <p className="font-medium">{r.name}</p> },
          { header: 'Retailer', cell: (r) => <span className="text-muted-foreground">{r.retailer_name}</span> },
          { header: 'Price', cell: (r) => <span className="font-mono">₹{r.price}</span> },
          { header: 'Stock Level', cell: (r) => stockBadge(r.stock) },
        ]}
      />
    </div>
  );
};

export default AdminInventory;

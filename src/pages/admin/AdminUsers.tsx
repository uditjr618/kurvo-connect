import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Ban, Check, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Row {
  id: string;
  full_name: string;
  phone: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  role: string | null;
}

const ROLES = ['customer', 'plumber', 'distributor', 'retailer', 'admin'];

const AdminUsers = () => {
  const [params, setParams] = useSearchParams();
  const roleFilter = params.get('role') ?? 'all';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setRows(null);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, points, is_active, created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const roleMap = new Map<string, string>();
    (roles ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
    setRows((profs ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? null })));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    return rows.filter((r) => {
      const okRole = roleFilter === 'all' || r.role === roleFilter;
      const okSearch = !search || r.full_name.toLowerCase().includes(search.toLowerCase()) || (r.phone ?? '').includes(search);
      return okRole && okSearch;
    });
  }, [rows, roleFilter, search]);

  const toggleActive = async (row: Row) => {
    const { error } = await supabase.from('profiles').update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) return toast.error(error.message);
    toast.success(row.is_active ? 'User deactivated' : 'User activated');
    load();
  };

  const changeRole = async (row: Row, newRole: string) => {
    if (newRole === row.role) return;
    await supabase.from('user_roles').delete().eq('user_id', row.id);
    const { error } = await supabase.from('user_roles').insert({ user_id: row.id, role: newRole as any });
    if (error) return toast.error(error.message);
    toast.success(`Role set to ${newRole}`);
    load();
  };

  const deleteProfile = async (row: Row) => {
    if (!confirm(`Delete profile for ${row.full_name}? Their auth account remains.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', row.id);
    if (error) return toast.error(error.message);
    toast.success('Profile removed');
    load();
  };

  return (
    <div>
      <PageHeader title="Users" description="Search, filter, promote and manage every user." />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { v === 'all' ? params.delete('role') : params.set('role', v); setParams(params); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        rows={filtered}
        keyFn={(r) => r.id}
        emptyText="No users match your filters"
        columns={[
          { header: 'Name', cell: (r) => (
            <div>
              <p className="font-medium">{r.full_name}</p>
              <p className="text-xs text-muted-foreground">{r.phone ?? '—'}</p>
            </div>
          ) },
          { header: 'Role', cell: (r) => (
            <Select value={r.role ?? ''} onValueChange={(v) => changeRole(r, v)}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          ) },
          { header: 'Points', cell: (r) => <span className="font-mono">{r.points}</span> },
          { header: 'Status', cell: (r) => r.is_active
            ? <Badge variant="secondary" className="bg-accent/10 text-accent">Active</Badge>
            : <Badge variant="destructive">Disabled</Badge> },
          { header: 'Joined', cell: (r) => <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</span> },
          { header: 'Actions', className: 'text-right', cell: (r) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" onClick={() => toggleActive(r)} title={r.is_active ? 'Deactivate' : 'Activate'}>
                {r.is_active ? <Ban size={15} className="text-destructive" /> : <Check size={15} className="text-accent" />}
              </Button>
              {r.role !== 'admin' && (
                <Button size="icon" variant="ghost" onClick={() => changeRole(r, 'admin')} title="Make admin">
                  <Shield size={15} />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => deleteProfile(r)} title="Delete profile">
                <Trash2 size={15} className="text-destructive" />
              </Button>
            </div>
          ) },
        ]}
      />
    </div>
  );
};

export default AdminUsers;

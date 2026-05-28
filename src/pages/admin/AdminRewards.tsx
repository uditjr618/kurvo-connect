import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Row { id: string; title: string; description: string | null; points_cost: number; is_active: boolean; image_url: string | null; }

const AdminRewards = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ title: '', description: '', points_cost: 100, image_url: '' });

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('rewards').select('*').order('points_cost', { ascending: true });
    setRows(data as Row[]);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', points_cost: 100, image_url: '' }); setOpen(true); };
  const openEdit = (r: Row) => { setEditing(r); setForm({ title: r.title, description: r.description ?? '', points_cost: r.points_cost, image_url: r.image_url ?? '' }); setOpen(true); };

  const save = async () => {
    if (!form.title) return toast.error('Title required');
    const payload = { title: form.title, description: form.description || null, points_cost: Number(form.points_cost), image_url: form.image_url || null };
    const { error } = editing
      ? await supabase.from('rewards').update(payload).eq('id', editing.id)
      : await supabase.from('rewards').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Created'); setOpen(false); load();
  };

  const toggleActive = async (r: Row) => {
    await supabase.from('rewards').update({ is_active: !r.is_active }).eq('id', r.id);
    toast.success('Updated'); load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete ${r.title}?`)) return;
    await supabase.from('rewards').delete().eq('id', r.id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <PageHeader title="Rewards" description="Manage the rewards catalog" action={
        <Button onClick={openCreate}><Plus size={16} className="mr-1"/>New Reward</Button>
      } />
      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No rewards yet"
        columns={[
          { header: 'Title', cell: (r) => <p className="font-medium">{r.title}</p> },
          { header: 'Points', cell: (r) => <span className="font-mono">{r.points_cost}</span> },
          { header: 'Active', cell: (r) => <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} /> },
          { header: 'Status', cell: (r) => r.is_active ? <Badge className="bg-accent/10 text-accent">Live</Badge> : <Badge variant="outline">Off</Badge> },
          { header: '', className: 'text-right', cell: (r) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil size={15}/></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 size={15} className="text-destructive"/></Button>
            </div>
          ) },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit reward' : 'New reward'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Points cost</Label><Input type="number" value={form.points_cost} onChange={(e) => setForm({ ...form, points_cost: Number(e.target.value) })} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Create reward'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRewards;

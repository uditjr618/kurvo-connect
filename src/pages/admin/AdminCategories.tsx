import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Row { id: string; name: string; icon: string | null; created_at: string; }

const AdminCategories = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '' });

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    setRows(data as Row[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return toast.error('Name required');
    const { error } = await supabase.from('categories').insert({ name: form.name, icon: form.icon || null });
    if (error) return toast.error(error.message);
    toast.success('Category added');
    setOpen(false); setForm({ name: '', icon: '' }); load();
  };
  const remove = async (r: Row) => {
    if (!confirm(`Delete ${r.name}?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <PageHeader title="Categories" description="Organize product taxonomy" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-1"/>New Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Icon (emoji or lucide name)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🔧" /></div>
              <Button onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      } />
      <DataTable
        rows={rows}
        keyFn={(r) => r.id}
        emptyText="No categories"
        columns={[
          { header: 'Icon', cell: (r) => <span className="text-lg">{r.icon ?? '📦'}</span> },
          { header: 'Name', cell: (r) => <p className="font-medium">{r.name}</p> },
          { header: 'Actions', className: 'text-right', cell: (r) => (
            <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 size={15} className="text-destructive"/></Button>
          ) },
        ]}
      />
    </div>
  );
};

export default AdminCategories;

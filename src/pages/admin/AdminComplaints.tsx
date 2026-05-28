import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Row {
  id: string; user_id: string; subject: string; message: string; status: string;
  admin_response: string | null; created_at: string; user_name?: string;
}

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const AdminComplaints = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [response, setResponse] = useState('');

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    const ids = Array.from(new Set((data ?? []).map((c: any) => c.user_id)));
    const { data: profs } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] };
    const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
    setRows((data ?? []).map((c: any) => ({ ...c, user_name: m.get(c.user_id) ?? '—' })));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (r: Row, status: string) => {
    await supabase.from('complaints').update({ status }).eq('id', r.id);
    toast.success('Status updated'); load();
  };
  const remove = async (r: Row) => {
    if (!confirm('Delete complaint?')) return;
    await supabase.from('complaints').delete().eq('id', r.id);
    toast.success('Deleted'); load();
  };
  const respond = async () => {
    if (!editing) return;
    await supabase.from('complaints').update({ admin_response: response, status: 'resolved' }).eq('id', editing.id);
    toast.success('Response sent');
    // also notify the user
    await supabase.from('notifications').insert({
      user_id: editing.user_id,
      title: 'Complaint resolved',
      body: `Re: ${editing.subject}`,
    } as any);
    setEditing(null); setResponse(''); load();
  };

  return (
    <div>
      <PageHeader title="Complaints" description="User-submitted issues and feedback" />
      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No complaints"
        columns={[
          { header: 'From', cell: (r) => r.user_name },
          { header: 'Subject', cell: (r) => <button className="text-left font-medium hover:underline" onClick={() => { setEditing(r); setResponse(r.admin_response ?? ''); }}>{r.subject}</button> },
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.subject}</DialogTitle></DialogHeader>
          <p className="rounded-lg bg-muted p-3 text-sm">{editing?.message}</p>
          <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write your response…" rows={4} />
          <Button onClick={respond} className="w-full">Send response & resolve</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComplaints;

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sendWhatsApp } from '@/lib/wa';

interface Row {
  id: string; user_id: string | null; phone: string | null; title: string | null;
  body: string | null; link: string | null; status: string; provider_message_id: string | null;
  error: string | null; created_at: string; user_name?: string;
}

const AdminWhatsApp = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target: 'all', role: 'customer', title: '', body: '' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    setRows(null);
    const { data } = await supabase.from('whatsapp_logs')
      .select('*').order('created_at', { ascending: false }).limit(200);
    const ids = Array.from(new Set((data ?? []).map((n: any) => n.user_id).filter(Boolean)));
    const { data: profs } = ids.length
      ? await supabase.from('profiles').select('id, full_name').in('id', ids as string[])
      : { data: [] as any[] };
    const m = new Map<string, string>(); (profs ?? []).forEach((p: any) => m.set(p.id, p.full_name));
    setRows((data ?? []).map((n: any) => ({ ...n, user_name: n.user_id ? (m.get(n.user_id) ?? '—') : 'Direct' })));
  };
  useEffect(() => { load(); }, []);

  const broadcast = async () => {
    if (!form.title) return toast.error('Title required');
    setSending(true);
    let targets: { id: string }[] = [];
    if (form.target === 'all') {
      const { data } = await supabase.from('profiles').select('id').eq('whatsapp_opt_in', true);
      targets = (data ?? []) as any;
    } else {
      const { data: rs } = await supabase.from('user_roles').select('user_id').eq('role', form.role as any);
      const ids = (rs ?? []).map((r: any) => r.user_id);
      if (ids.length) {
        const { data } = await supabase.from('profiles').select('id').in('id', ids).eq('whatsapp_opt_in', true);
        targets = (data ?? []) as any;
      }
    }
    if (targets.length === 0) { setSending(false); return toast.error('No opted-in recipients'); }
    // Fire in parallel (server will rate-limit if needed)
    await Promise.all(targets.map(t =>
      sendWhatsApp({ user_id: t.id, title: form.title, body: form.body || undefined })
    ));
    setSending(false);
    toast.success(`Broadcast triggered for ${targets.length} user(s)`);
    setOpen(false);
    setForm({ target: 'all', role: 'customer', title: '', body: '' });
    setTimeout(load, 1500);
  };

  const statusBadge = (s: string) => {
    if (s === 'sent') return <Badge className="bg-[#25D366]/15 text-[#128C7E]">Sent</Badge>;
    if (s === 'failed') return <Badge variant="destructive">Failed</Badge>;
    if (s === 'skipped') return <Badge variant="outline">Skipped</Badge>;
    return <Badge variant="secondary">{s}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Delivery logs & broadcasts via Meta Cloud API"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white"><MessageCircle size={16} className="mr-1"/>Broadcast WhatsApp</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send WhatsApp broadcast</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Audience</Label>
                  <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All opted-in users</SelectItem>
                      <SelectItem value="role">By role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.target === 'role' && (
                  <div>
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {['customer','plumber','retailer','distributor','admin'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <Button disabled={sending} onClick={broadcast} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                  <Send size={14} className="mr-1.5"/>{sending ? 'Sending…' : 'Send'}
                </Button>
                <p className="text-[11px] text-muted-foreground">Note: Meta restricts free-form messages to users who messaged you in the last 24 hours. For initial outreach use approved Message Templates.</p>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        rows={rows} keyFn={(r) => r.id} emptyText="No WhatsApp messages yet"
        columns={[
          { header: 'Recipient', cell: (r) => <div><p className="text-sm font-medium">{r.user_name}</p><p className="text-[11px] text-muted-foreground">{r.phone || '—'}</p></div> },
          { header: 'Title', cell: (r) => <div className="max-w-[260px]"><p className="text-sm truncate">{r.title || '—'}</p>{r.body && <p className="text-[11px] text-muted-foreground truncate">{r.body}</p>}</div> },
          { header: 'Status', cell: (r) => statusBadge(r.status) },
          { header: 'Error', cell: (r) => r.error ? <span className="text-[11px] text-destructive truncate max-w-[200px] inline-block">{r.error}</span> : <span className="text-[11px] text-muted-foreground">—</span> },
          { header: 'Date', cell: (r) => <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, HH:mm')}</span> },
        ]}
      />
    </div>
  );
};

export default AdminWhatsApp;

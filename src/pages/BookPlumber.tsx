import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Phone, Wrench, Navigation, Loader2, User as UserIcon, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getCurrentPosition, distanceKm, formatDistance, type Coords } from '@/lib/geo';
import { openWhatsAppChat } from '@/lib/wa';

const services = ['Leakage Fix', 'Tap Install', 'Pipe Repair', 'Drain Cleaning', 'Tank Cleaning', 'General Service'];

interface Plumber {
  id: string; full_name: string; address: string | null;
  latitude: number | null; longitude: number | null;
  phone?: string | null; whatsapp_number?: string | null;
  distance?: number | null;
}

const BookPlumber = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [serviceType, setServiceType] = useState(services[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Coords | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [plumbers, setPlumbers] = useState<Plumber[]>([]);

  useEffect(() => {
    if ((profile as any)?.latitude && (profile as any)?.longitude) {
      setMe({ latitude: (profile as any).latitude, longitude: (profile as any).longitude });
    }
    if (profile?.address && !location) setLocation(profile.address);
    (async () => {
      const { data } = await (supabase as any).rpc('list_plumbers');
      setPlumbers((data ?? []) as Plumber[]);
    })();
  }, [profile]);

  const useMyLocation = async () => {
    setLocBusy(true);
    try { const c = await getCurrentPosition(); setMe(c); toast.success('Nearby plumbers updated'); }
    catch (e: any) { toast.error(e?.message || 'Could not get location'); }
    finally { setLocBusy(false); }
  };

  const ranked = plumbers
    .map(p => ({
      ...p,
      distance: me && p.latitude && p.longitude
        ? distanceKm(me, { latitude: p.latitude, longitude: p.longitude })
        : null,
    }))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return (a.distance as number) - (b.distance as number);
    })
    .slice(0, 5);

  const chatPlumber = (p: Plumber) => {
    const num = p.whatsapp_number || p.phone;
    const ok = openWhatsAppChat(num, `Hi ${p.full_name || ''}, I need help with ${serviceType} at ${location || 'my location'}.`);
    if (!ok) toast.error('Plumber has not shared a WhatsApp number');
  };

  const submit = async () => {
    if (!user) return;
    if (!location.trim()) return toast.error('Please enter your location');
    if (!date) return toast.error('Please choose a date');
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      customer_id: user.id, service_type: serviceType, location, scheduled_date: date, scheduled_time: time, notes,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    await notifySelf('Booking submitted', `${serviceType} on ${date}. We'll find a plumber for you.`);
    toast.success('Booking submitted!');
    navigate('/my-orders');
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Book a Plumber</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get a verified plumber at your doorstep</p>

        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-5 space-y-4">
          <div>
            <Label className="mb-2 block flex items-center gap-1.5"><Wrench size={14}/>Service Type</Label>
            <div className="flex flex-wrap gap-2">
              {services.map(s => (
                <button key={s} onClick={() => setServiceType(s)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${serviceType===s?'border-primary bg-primary text-primary-foreground':'border-border text-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><MapPin size={14}/>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="House no., street, area" className="mt-1.5 h-11" />
            <Button variant="outline" size="sm" onClick={useMyLocation} disabled={locBusy} className="mt-2">
              {locBusy ? <Loader2 size={14} className="mr-1.5 animate-spin"/> : <Navigation size={14} className="mr-1.5"/>}
              Use current location
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1.5"><Calendar size={14}/>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1.5 h-11" />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe the issue…" className="mt-1.5" rows={3} />
          </div>

          {ranked.length > 0 && (
            <div>
              <Label className="mb-2 block flex items-center gap-1.5"><Navigation size={14}/>{me ? 'Nearby plumbers' : 'Available plumbers'}</Label>
              <div className="space-y-2">
                {ranked.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserIcon size={16}/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name || 'Plumber'}</p>
                      {p.address && <p className="text-xs text-muted-foreground truncate">{p.address}</p>}
                    </div>
                    {p.distance != null && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold">{formatDistance(p.distance)}</span>
                    )}
                    <Button size="icon" variant="outline" onClick={() => chatPlumber(p)} title="WhatsApp chat"
                      className="h-9 w-9 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
                      <MessageCircle size={16}/>
                    </Button>
                  </div>
                ))}
              </div>
              {!me && <p className="mt-2 text-xs text-muted-foreground">Tap "Use current location" to sort by distance.</p>}
            </div>
          )}

          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={12}/> We'll call you on {profile?.phone || 'your registered number'}</p>
          </div>
          <Button disabled={busy} onClick={submit} className="h-12 w-full gradient-primary border-0 text-primary-foreground font-semibold">{busy?'Booking…':'Confirm Booking'}</Button>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default BookPlumber;

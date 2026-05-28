import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Phone, Wrench } from 'lucide-react';
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

const services = ['Leakage Fix', 'Tap Install', 'Pipe Repair', 'Drain Cleaning', 'Tank Cleaning', 'General Service'];

const BookPlumber = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [serviceType, setServiceType] = useState(services[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

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

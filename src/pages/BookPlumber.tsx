import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Wrench, Calendar, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const serviceTypes = ['Installation', 'Repair', 'Leakage Fix', 'Maintenance', 'Pipe Fitting', 'Water Tank'];

const BookPlumber = () => {
  const { user } = useAuth();
  const { addBooking } = useApp();
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState(user?.phone || '');
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!location || !service || !date || !time || !contact) {
      toast.error('Please fill all fields');
      return;
    }
    addBooking({
      customerId: user!.id,
      customerName: user!.name,
      customerPhone: contact,
      location,
      serviceType: service,
      date,
      time,
    });
    toast.success('Plumber booked successfully!');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setLocation(''); setService(''); setDate(''); setTime('');
    }, 3000);
  };

  const handleGPS = () => {
    setLocation('Sector 15, Noida, UP');
    toast.info('Location detected (simulated)');
  };

  return (
    <PageWrapper title="Book a Plumber" subtitle="Schedule a plumbing service">
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 size={48} className="text-accent" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="mt-1 text-sm text-muted-foreground">A plumber will be assigned shortly</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Location */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Location</label>
                <div className="flex gap-2">
                  <Input placeholder="Enter your address" value={location} onChange={(e) => setLocation(e.target.value)} className="h-12" />
                  <Button variant="outline" onClick={handleGPS} className="h-12 shrink-0 px-3">
                    <MapPin size={18} />
                  </Button>
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Service Type</label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map(s => (
                    <button
                      key={s}
                      onClick={() => setService(s)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all touch-target ${
                        service === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Time</label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12" />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Contact Number</label>
                <Input placeholder="Your phone number" value={contact} onChange={(e) => setContact(e.target.value)} className="h-12" />
              </div>

              <Button onClick={handleSubmit} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Book Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default BookPlumber;

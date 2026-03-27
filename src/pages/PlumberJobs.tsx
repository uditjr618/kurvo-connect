import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, MapPin, Phone, Wrench, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PlumberJobs = () => {
  const { user, updatePoints } = useAuth();
  const { bookings, updateBookingStatus, addTransaction } = useApp();

  if (!user) return null;

  const handleAccept = (id: string) => {
    updateBookingStatus(id, 'accepted');
    toast.success('Job accepted!');
  };

  const handleReject = (id: string) => {
    updateBookingStatus(id, 'rejected');
    toast.info('Job rejected');
  };

  const handleComplete = (id: string) => {
    updateBookingStatus(id, 'completed');
    const pts = Math.floor(Math.random() * 30) + 30;
    updatePoints(pts);
    addTransaction({ type: 'earn', amount: pts, description: 'Job completed bonus' });
    toast.success(`Job completed! +${pts} points earned`);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-primary/10 text-primary';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'completed': return 'bg-accent/10 text-accent';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <PageWrapper title="My Jobs" subtitle="Incoming service requests">
      <div className="px-5 py-4">
        {/* Earnings card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-4 rounded-2xl gradient-accent p-5 text-accent-foreground"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Earnings Points</p>
            <p className="text-2xl font-extrabold">{user.points.toLocaleString()}</p>
          </div>
        </motion.div>

        {bookings.length === 0 ? (
          <div className="rounded-xl bg-secondary/50 p-8 text-center">
            <Wrench size={40} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No job requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card p-4 elevated-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{b.customerName}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{b.serviceType}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><MapPin size={12} />{b.location}</div>
                  <div className="flex items-center gap-1.5"><Clock size={12} />{b.date} at {b.time}</div>
                  <div className="flex items-center gap-1.5"><Phone size={12} />{b.customerPhone}</div>
                </div>
                {b.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(b.id)} className="flex-1 gradient-primary border-0 text-primary-foreground touch-target">
                      <CheckCircle size={14} className="mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(b.id)} className="flex-1 touch-target">
                      <XCircle size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                )}
                {b.status === 'accepted' && (
                  <Button size="sm" onClick={() => handleComplete(b.id)} className="mt-3 w-full gradient-accent border-0 text-accent-foreground touch-target">
                    Mark Complete
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PlumberJobs;

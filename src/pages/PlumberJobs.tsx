import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { awardPoints, notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Booking { id: string; customer_id: string; service_type: string; location: string; scheduled_date: string | null; scheduled_time: string | null; notes: string | null; status: string; created_at: string; plumber_id: string | null; }

const PlumberJobs = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [jobs, setJobs] = useState<Booking[] | null>(null);

  const load = async () => {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    setJobs((data as Booking[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string, reward = 0) => {
    if (!user) return;
    const patch: { status: string; plumber_id?: string } = { status };
    if (status === 'accepted') patch.plumber_id = user.id;
    const { error } = await supabase.from('bookings').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    if (reward > 0) {
      await awardPoints(user.id, reward, 'Plumber job completed');
      await notifySelf(`+${reward} points`, 'Job completed successfully');
      await refreshProfile();
    }
    toast.success(`Job ${status}`);
    load();
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accept jobs to start earning points</p>

        <div className="mt-5 space-y-3 pb-4">
          {jobs === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-32 rounded-2xl"/>) :
            jobs.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No jobs yet</p> :
            jobs.map((j, i) => (
              <motion.div key={j.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{j.service_type}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11}/>{j.location}</p>
                    {j.scheduled_date && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11}/>{j.scheduled_date} {j.scheduled_time}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                    j.status==='pending'?'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400':
                    j.status==='accepted'?'bg-blue-500/10 text-blue-700 dark:text-blue-400':
                    j.status==='completed'?'bg-accent/10 text-accent':'bg-destructive/10 text-destructive'
                  }`}>{j.status}</span>
                </div>
                {j.notes && <p className="mt-2 text-xs text-muted-foreground italic">"{j.notes}"</p>}
                <div className="mt-3 flex gap-2">
                  {j.status === 'pending' && <>
                    <Button size="sm" onClick={() => update(j.id, 'accepted')} className="flex-1 gradient-primary border-0 text-primary-foreground"><Check size={14} className="mr-1"/>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => update(j.id, 'rejected')} className="flex-1"><X size={14} className="mr-1"/>Reject</Button>
                  </>}
                  {j.status === 'accepted' && j.plumber_id === user?.id && (
                    <Button size="sm" onClick={() => update(j.id, 'completed', 100)} className="flex-1 gradient-accent border-0 text-accent-foreground"><Sparkles size={14} className="mr-1"/>Mark Complete (+100)</Button>
                  )}
                </div>
              </motion.div>
            ))
          }
        </div>
      </div>
    </PageWrapper>
  );
};

export default PlumberJobs;

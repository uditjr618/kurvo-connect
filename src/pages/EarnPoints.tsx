import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, QrCode, Hash, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { awardPoints, notifySelf } from '@/lib/api';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const methods = [
  { id: 'bill', icon: Upload, title: 'Upload Bill', desc: 'Scan/upload a purchase bill', points: 50 },
  { id: 'code', icon: Hash, title: 'Product Code', desc: 'Enter code from packaging', points: 30 },
  { id: 'qr', icon: QrCode, title: 'Scan QR', desc: 'Simulate a product QR scan', points: 40 },
];

const EarnPoints = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [active, setActive] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const earn = async (id: string, amount: number, desc: string) => {
    if (!user) return;
    setBusy(true);
    try {
      await awardPoints(user.id, amount, desc);
      await notifySelf(`+${amount} points earned`, desc);
      await refreshProfile();
      toast.success(`+${amount} points earned!`);
      setActive(null); setCode('');
    } catch (e) {
      toast.error('Failed to earn points');
    } finally { setBusy(false); }
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>
        <h1 className="text-2xl font-bold">Earn Points</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose how you'd like to earn today</p>

        <div className="mt-5 space-y-3">
          {methods.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }}
              onClick={() => setActive(active === m.id ? null : m.id)}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${active===m.id ? 'border-primary bg-primary/5':'border-border bg-card hover:border-primary/30'}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><m.icon size={22}/></div>
              <div className="flex-1">
                <p className="font-semibold">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">+{m.points}</div>
            </motion.button>
          ))}
        </div>

        {active === 'bill' && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-5 rounded-2xl border bg-card p-4">
            <Label>Upload your bill</Label>
            <input type="file" accept="image/*,application/pdf" className="mt-2 block w-full text-sm" />
            <Button disabled={busy} onClick={() => earn('bill', 50, 'Bill upload')} className="mt-4 w-full gradient-primary border-0 text-primary-foreground"><Sparkles className="mr-1.5" size={16}/>Submit & Earn 50</Button>
          </motion.div>
        )}
        {active === 'code' && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-5 rounded-2xl border bg-card p-4">
            <Label>Product Code</Label>
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123XYZ" className="mt-2 h-11 uppercase tracking-wider" />
            <Button disabled={busy || code.length < 4} onClick={() => earn('code', 30, `Code: ${code}`)} className="mt-4 w-full gradient-primary border-0 text-primary-foreground"><Sparkles className="mr-1.5" size={16}/>Redeem Code</Button>
          </motion.div>
        )}
        {active === 'qr' && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-5 rounded-2xl border bg-card p-4 text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-secondary"><QrCode size={64} className="text-muted-foreground"/></div>
            <p className="mt-3 text-xs text-muted-foreground">Simulated QR scan</p>
            <Button disabled={busy} onClick={() => earn('qr', 40, 'QR scan reward')} className="mt-4 w-full gradient-primary border-0 text-primary-foreground"><Sparkles className="mr-1.5" size={16}/>Simulate Scan +40</Button>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default EarnPoints;

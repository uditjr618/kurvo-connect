import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, QrCode, Keyboard, CheckCircle2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const EarnPoints = () => {
  const { updatePoints } = useAuth();
  const { addTransaction } = useApp();
  const [method, setMethod] = useState<'bill' | 'code' | 'qr' | null>(null);
  const [productCode, setProductCode] = useState('');
  const [billUploaded, setBillUploaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const submitEarn = (desc: string) => {
    const pts = Math.floor(Math.random() * 50) + 20;
    updatePoints(pts);
    addTransaction({ type: 'earn', amount: pts, description: desc });
    setShowSuccess(true);
    toast.success(`+${pts} points earned!`);
    setTimeout(() => { setShowSuccess(false); setMethod(null); setProductCode(''); setBillUploaded(false); }, 2000);
  };

  const methods = [
    { id: 'bill' as const, icon: Upload, label: 'Upload Bill', desc: 'Scan your purchase bill' },
    { id: 'code' as const, icon: Keyboard, label: 'Product Code', desc: 'Enter code from product' },
    { id: 'qr' as const, icon: QrCode, label: 'Scan QR', desc: 'Scan product QR code' },
  ];

  return (
    <PageWrapper title="Earn Points" subtitle="Choose how to earn reward points">
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 size={48} className="text-accent" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Points Earned!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Check your wallet for details</p>
            </motion.div>
          ) : !method ? (
            <motion.div key="methods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {methods.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setMethod(m.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 touch-target elevated-card"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <m.icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : method === 'bill' ? (
            <motion.div key="bill" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div
                onClick={() => setBillUploaded(true)}
                className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${billUploaded ? 'border-accent bg-accent/5' : 'border-border bg-secondary/50 hover:border-primary/30'}`}
              >
                {billUploaded ? (
                  <>
                    <CheckCircle2 size={40} className="text-accent" />
                    <p className="mt-2 text-sm font-medium text-accent">Bill uploaded</p>
                  </>
                ) : (
                  <>
                    <Camera size={40} className="text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Tap to upload or take photo</p>
                  </>
                )}
              </div>
              <Button onClick={() => submitEarn('Bill upload')} disabled={!billUploaded} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Submit Bill
              </Button>
              <button onClick={() => setMethod(null)} className="w-full text-sm text-muted-foreground">Back</button>
            </motion.div>
          ) : method === 'code' ? (
            <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <Input placeholder="Enter product code" value={productCode} onChange={(e) => setProductCode(e.target.value.toUpperCase())} className="h-12 text-center text-lg font-mono tracking-widest" />
              <Button onClick={() => submitEarn(`Product code: ${productCode}`)} disabled={productCode.length < 4} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Submit Code
              </Button>
              <button onClick={() => setMethod(null)} className="w-full text-sm text-muted-foreground">Back</button>
            </motion.div>
          ) : (
            <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/50">
                <QrCode size={64} className="text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Camera will open here</p>
                <p className="text-xs text-muted-foreground">(Simulated)</p>
              </div>
              <Button onClick={() => submitEarn('QR scan')} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Simulate QR Scan
              </Button>
              <button onClick={() => setMethod(null)} className="w-full text-sm text-muted-foreground">Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default EarnPoints;

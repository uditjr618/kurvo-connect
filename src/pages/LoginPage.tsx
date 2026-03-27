import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, ChevronRight, Shield, Droplets, Store } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'customer', label: 'Customer', icon: <User size={24} />, desc: 'Earn rewards & book services' },
  { value: 'plumber', label: 'Plumber', icon: <Droplets size={24} />, desc: 'Get jobs & earn income' },
  { value: 'distributor', label: 'Distributor', icon: <Shield size={24} />, desc: 'Manage shop supply chain' },
  { value: 'retailer', label: 'Retailer / Shop', icon: <Store size={24} />, desc: 'Sell products & manage orders' },
];

const LoginPage = () => {
  const [step, setStep] = useState<'phone' | 'otp' | 'role' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (phone.length >= 10) setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) setStep('role');
  };

  const handleComplete = () => {
    if (name.trim()) {
      login(phone, role, name.trim());
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <Droplets size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kurvo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rewards & Services</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex h-12 items-center rounded-lg border border-border bg-secondary px-3 text-sm font-medium text-muted-foreground">+91</div>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <Button onClick={handleSendOtp} disabled={phone.length < 10} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Send OTP <ChevronRight size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Verification Code</label>
                <p className="mb-3 text-xs text-muted-foreground">Sent to +91 {phone} (use any 4 digits)</p>
                <Input
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="h-12 text-center text-2xl tracking-[0.5em] font-bold"
                />
              </div>
              <Button onClick={handleVerifyOtp} disabled={otp.length < 4} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Verify <ChevronRight size={18} className="ml-1" />
              </Button>
              <button onClick={() => setStep('phone')} className="w-full text-sm text-muted-foreground hover:text-foreground">
                Change number
              </button>
            </motion.div>
          )}

          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <label className="mb-1 block text-sm font-medium text-foreground">I am a...</label>
              {roles.map((r, i) => (
                <motion.button
                  key={r.value}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setRole(r.value); setStep('name'); }}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all touch-target ${
                    role === r.value ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {r.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                  <ChevronRight size={18} className="ml-auto text-muted-foreground" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Your Name</label>
                <Input
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <Button onClick={handleComplete} disabled={!name.trim()} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                Get Started <ChevronRight size={18} className="ml-1" />
              </Button>
              <button onClick={() => setStep('role')} className="w-full text-sm text-muted-foreground hover:text-foreground">
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, ChevronRight, User, Wrench, Truck, Store } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const roles: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: 'customer', label: 'Customer', icon: <User size={18} /> },
  { value: 'plumber', label: 'Plumber', icon: <Wrench size={18} /> },
  { value: 'retailer', label: 'Retailer', icon: <Store size={18} /> },
  { value: 'distributor', label: 'Distributor', icon: <Truck size={18} /> },
];

const AuthPage = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [role, setRole] = useState<UserRole>('customer');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) return toast.error(error);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        if (!fullName.trim()) return toast.error('Please enter your name');
        const { error } = await signUp(email, password, fullName.trim(), role);
        if (error) return toast.error(error);
        toast.success('Account created! You can now sign in.');
        setMode('signin');
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Droplets size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kurvo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rewards & Services Marketplace</p>
        </div>

        <div className="elevated-card rounded-2xl p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <TabsContent value="signup" className="space-y-4 m-0">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="mb-2 block">I am a...</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                          role === r.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {r.icon}{r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1.5 h-11" />
              </div>

              <Button type="submit" disabled={busy} className="h-11 w-full gradient-primary border-0 text-primary-foreground font-semibold">
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </form>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" onClick={signInWithGoogle} className="h-11 w-full font-medium">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to Kurvo's Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;

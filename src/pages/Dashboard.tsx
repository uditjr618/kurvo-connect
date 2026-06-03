import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Wrench, Wallet, Store, ShoppingCart, Star, LogOut, TrendingUp, ClipboardList, Truck, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageWrapper from '@/components/PageWrapper';
import ActionCard from '@/components/ActionCard';
import NotificationsBell from '@/components/NotificationsBell';
import ThemeToggle from '@/components/ThemeToggle';

const Dashboard = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const customerActions = [
    { icon: Store, label: 'Browse Shops', onClick: () => navigate('/shops'), delay: 0.1, variant: 'primary' as const },
    { icon: Gift, label: 'Earn Points', onClick: () => navigate('/earn'), delay: 0.15 },
    { icon: Wrench, label: 'Book Plumber', onClick: () => navigate('/book-plumber'), delay: 0.2 },
    { icon: ShoppingCart, label: 'My Orders', onClick: () => navigate('/my-orders'), delay: 0.25 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.3 },
    { icon: Gift, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.35 },
  ];
  const plumberActions = [
    { icon: Wrench, label: 'My Jobs', onClick: () => navigate('/plumber-jobs'), variant: 'primary' as const, delay: 0.1 },
    { icon: Store, label: 'Browse Shops', onClick: () => navigate('/shops'), delay: 0.15 },
    { icon: ShoppingCart, label: 'My Orders', onClick: () => navigate('/my-orders'), delay: 0.2 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.25 },
    { icon: Gift, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.3 },
  ];
  const distributorActions = [
    { icon: Truck, label: 'Market', onClick: () => navigate('/market'), variant: 'primary' as const, delay: 0.1 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.15 },
    { icon: Gift, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.2 },
  ];
  const retailerActions = [
    { icon: ClipboardList, label: 'My Shop', onClick: () => navigate('/retailer'), variant: 'primary' as const, delay: 0.1 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.15 },
    { icon: Gift, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.2 },
  ];
  const adminActions = [
    { icon: ShieldCheck, label: 'Admin Panel', onClick: () => navigate('/admin'), variant: 'primary' as const, delay: 0.1 },
    { icon: Store, label: 'Shops', onClick: () => navigate('/shops'), delay: 0.15 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.2 },
  ];

  const actions =
    role === 'plumber' ? plumberActions :
    role === 'distributor' ? distributorActions :
    role === 'retailer' ? retailerActions :
    role === 'admin' ? adminActions : customerActions;

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon size={20} />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">{greeting()}</p>
              <h1 className="text-lg font-bold text-foreground leading-tight">{profile.full_name || 'Friend'} 👋</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
            <button onClick={async () => { await signOut(); navigate('/'); }} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Total Reward Points</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">{profile.points.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm w-fit">
                <TrendingUp size={12} /> <span>Keep earning!</span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Star size={28} />
            </div>
          </div>
        </motion.div>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">{role}</span>
          <span className="text-xs text-muted-foreground">Account</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 pb-4">
          {actions.map((action) => <ActionCard key={action.label} {...action} />)}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

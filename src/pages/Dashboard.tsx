import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Wrench, Wallet, Store, ShoppingBag, Star, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageWrapper from '@/components/PageWrapper';
import ActionCard from '@/components/ActionCard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const customerActions = [
    { icon: Gift, label: 'Earn Points', onClick: () => navigate('/earn'), delay: 0.1 },
    { icon: Wrench, label: 'Book Plumber', onClick: () => navigate('/book-plumber'), delay: 0.15 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.2 },
    { icon: Store, label: 'Rewards Store', onClick: () => navigate('/rewards'), delay: 0.25 },
  ];

  const plumberActions = [
    { icon: Wrench, label: 'My Jobs', onClick: () => navigate('/plumber-jobs'), delay: 0.1 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.15 },
    { icon: Store, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.2 },
  ];

  const distributorActions = [
    { icon: ShoppingBag, label: 'Market', onClick: () => navigate('/market'), variant: 'primary' as const, delay: 0.1 },
    { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), delay: 0.15 },
    { icon: Store, label: 'Rewards', onClick: () => navigate('/rewards'), delay: 0.2 },
  ];

  const actions = user.role === 'plumber' ? plumberActions : user.role === 'distributor' ? distributorActions : customerActions;

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-2xl font-bold text-foreground">{user.name} 👋</h1>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={18} />
          </button>
        </div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Total Reward Points</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">{user.points.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm w-fit">
                <TrendingUp size={12} /> <span>Keep earning!</span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Star size={28} />
            </div>
          </div>
        </motion.div>

        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 flex items-center gap-2"
        >
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">{user.role}</span>
          <span className="text-xs text-muted-foreground">Account</span>
        </motion.div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3 pb-4">
          {actions.map((action) => (
            <ActionCard key={action.label} {...action} />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

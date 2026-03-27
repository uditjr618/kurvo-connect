import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gift, Wallet, Wrench, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const customerTabs = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/shops', icon: Store, label: 'Shops' },
    { path: '/my-orders', icon: Gift, label: 'Orders' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/rewards', icon: Store, label: 'Rewards' },
  ];

  const plumberTabs = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/plumber-jobs', icon: Wrench, label: 'Jobs' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/rewards', icon: Store, label: 'Rewards' },
  ];

  const distributorTabs = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/market', icon: Store, label: 'Market' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
  ];

  const retailerTabs = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/retailer', icon: Store, label: 'My Shop' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
  ];

  const tabs = user?.role === 'plumber' ? plumberTabs : user?.role === 'distributor' ? distributorTabs : user?.role === 'retailer' ? retailerTabs : customerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 touch-target"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

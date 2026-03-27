import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';

const WalletPage = () => {
  const { user } = useAuth();
  const { transactions } = useApp();

  if (!user) return null;

  return (
    <PageWrapper title="Wallet" subtitle="Your points and transactions">
      <div className="px-5 py-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl gradient-hero p-6 text-primary-foreground"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <WalletIcon size={24} />
            </div>
            <div>
              <p className="text-sm opacity-80">Available Points</p>
              <p className="text-3xl font-extrabold">{user.points.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Transactions */}
        <h2 className="mt-6 mb-3 text-lg font-semibold text-foreground">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="rounded-xl bg-secondary/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-xl bg-card p-4 elevated-card"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.type === 'earn' ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                  {t.type === 'earn' ? <ArrowUpCircle size={20} className="text-accent" /> : <ArrowDownCircle size={20} className="text-destructive" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'earn' ? 'text-accent' : 'text-destructive'}`}>
                  {t.type === 'earn' ? '+' : '-'}{t.amount}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default WalletPage;

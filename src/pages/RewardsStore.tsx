import { motion } from 'framer-motion';
import { Gift, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const rewards = [
  { id: 'r1', name: '₹50 Cashback', points: 100, emoji: '💰' },
  { id: 'r2', name: '₹100 Cashback', points: 200, emoji: '💸' },
  { id: 'r3', name: 'Tool Kit', points: 500, emoji: '🔧' },
  { id: 'r4', name: 'Water Bottle', points: 80, emoji: '🧴' },
  { id: 'r5', name: '₹500 Gift Card', points: 1000, emoji: '🎁' },
  { id: 'r6', name: 'Safety Gloves', points: 150, emoji: '🧤' },
];

const RewardsStore = () => {
  const { user, updatePoints } = useAuth();
  const { addTransaction } = useApp();

  if (!user) return null;

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (user.points < reward.points) {
      toast.error('Not enough points!');
      return;
    }
    updatePoints(-reward.points);
    addTransaction({ type: 'redeem', amount: reward.points, description: `Redeemed: ${reward.name}` });
    toast.success(`${reward.name} redeemed successfully!`);
  };

  return (
    <PageWrapper title="Rewards Store" subtitle="Redeem your points for rewards">
      <div className="px-5 py-4">
        {/* Points banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-3 rounded-xl bg-primary/10 p-4"
        >
          <Gift size={20} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Your balance: <strong>{user.points.toLocaleString()} pts</strong></span>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {rewards.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center rounded-xl bg-card p-5 elevated-card"
            >
              <span className="text-4xl">{r.emoji}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground text-center">{r.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.points} pts</p>
              <Button
                size="sm"
                onClick={() => handleRedeem(r)}
                disabled={user.points < r.points}
                className="mt-3 w-full gradient-primary border-0 text-primary-foreground text-xs touch-target"
              >
                Redeem
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default RewardsStore;

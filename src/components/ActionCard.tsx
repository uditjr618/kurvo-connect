import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'accent';
  delay?: number;
}

const ActionCard = ({ icon: Icon, label, description, onClick, variant = 'default', delay = 0 }: ActionCardProps) => {
  const bgClass = variant === 'primary'
    ? 'gradient-primary text-primary-foreground'
    : variant === 'accent'
    ? 'gradient-accent text-accent-foreground'
    : 'bg-card text-card-foreground';

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-2 rounded-xl p-5 touch-target transition-shadow hover:shadow-lg ${bgClass} ${variant === 'default' ? 'elevated-card' : ''}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${variant === 'default' ? 'bg-primary/10' : 'bg-white/20'}`}>
        <Icon size={24} className={variant === 'default' ? 'text-primary' : ''} />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      {description && <span className="text-xs opacity-70">{description}</span>}
    </motion.button>
  );
};

export default ActionCard;

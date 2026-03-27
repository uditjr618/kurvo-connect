import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const PageWrapper = ({ children, title, subtitle, className = '' }: PageWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`min-h-screen safe-bottom ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-6 pb-2">
          {title && <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default PageWrapper;

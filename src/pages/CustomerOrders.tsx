import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';

const CustomerOrders = () => {
  const { user } = useAuth();
  const { orders } = useApp();

  if (!user) return null;

  const myOrders = orders.filter(o => o.customerId === user.id);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'pending': return <Clock size={14} className="text-yellow-600" />;
      case 'accepted': return <Package size={14} className="text-primary" />;
      case 'delivered': return <CheckCircle2 size={14} className="text-accent" />;
      case 'rejected': return <XCircle size={14} className="text-destructive" />;
      default: return null;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-primary/10 text-primary';
      case 'delivered': return 'bg-accent/10 text-accent';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <PageWrapper title="My Orders" subtitle="Track your purchases">
      <div className="px-5 py-4 space-y-3">
        {myOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Truck size={40} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground">Browse shops to place your first order</p>
          </div>
        ) : (
          myOrders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card p-4 elevated-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{o.product}</h3>
                  <p className="text-xs text-muted-foreground">From: {o.retailerName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {o.quantity} · {o.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(o.status)}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageWrapper>
  );
};

export default CustomerOrders;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ClipboardList, ShoppingCart, Plus, CheckCircle2, XCircle, Truck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const RetailerDashboard = () => {
  const { user, updatePoints } = useAuth();
  const { shops, addShopRequirement, orders, updateOrderStatus, addTransaction } = useApp();
  const [tab, setTab] = useState<'requirements' | 'orders' | 'post'>('requirements');

  // Post requirement form state
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Normal' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  if (!user) return null;

  const myRequirements = shops.filter(s => s.retailerId === user.id);
  const myOrders = orders.filter(o => o.retailerName === user.name);

  const handlePostRequirement = () => {
    if (!product.trim() || !quantity) return;
    addShopRequirement({
      shopName: user.name,
      shopDistance: '0 km',
      shopContact: user.phone,
      demandLevel: urgency === 'Urgent' ? 'High' : urgency === 'Normal' ? 'Medium' : 'Low',
      product: product.trim(),
      quantity: parseInt(quantity),
      urgency,
      retailerId: user.id,
      location: location || 'Not specified',
      notes,
    });
    toast.success('Requirement posted!');
    setProduct('');
    setQuantity('');
    setUrgency('Normal');
    setNotes('');
    setLocation('');
    setTab('requirements');
  };

  const handleAcceptOrder = (id: string) => {
    updateOrderStatus(id, 'accepted');
    toast.success('Order accepted!');
  };

  const handleRejectOrder = (id: string) => {
    updateOrderStatus(id, 'rejected');
    toast.info('Order rejected');
  };

  const handleDeliverOrder = (id: string) => {
    updateOrderStatus(id, 'delivered');
    const pts = 15;
    updatePoints(pts);
    addTransaction({ type: 'earn', amount: pts, description: 'Order delivered' });
    toast.success(`Order delivered! +${pts} points`);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-primary/10 text-primary';
      case 'fulfilled': case 'delivered': return 'bg-accent/10 text-accent';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <PageWrapper title="My Shop" subtitle="Manage requirements & orders">
      <div className="px-5 py-4">
        {/* Tabs */}
        <div className="mb-4 flex rounded-xl bg-secondary p-1">
          {[
            { key: 'requirements' as const, label: 'Requirements', icon: ClipboardList },
            { key: 'orders' as const, label: 'Orders', icon: ShoppingCart },
            { key: 'post' as const, label: 'Post', icon: Plus },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'post' && (
            <motion.div key="post" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Product Name</label>
                <Input placeholder="e.g. CPVC Pipe 1 inch" value={product} onChange={e => setProduct(e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Quantity</label>
                <Input type="number" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Urgency</label>
                <div className="flex gap-2">
                  {(['Low', 'Normal', 'Urgent'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                        urgency === u
                          ? u === 'Urgent' ? 'border-destructive bg-destructive/10 text-destructive'
                            : u === 'Normal' ? 'border-primary bg-primary/10 text-primary'
                            : 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {u === 'Urgent' && <AlertTriangle size={12} className="inline mr-1" />}
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Location</label>
                <Input placeholder="Shop location" value={location} onChange={e => setLocation(e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes (optional)</label>
                <Input placeholder="Any additional details" value={notes} onChange={e => setNotes(e.target.value)} className="h-12" />
              </div>
              <Button onClick={handlePostRequirement} disabled={!product.trim() || !quantity} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                <Package size={18} className="mr-2" /> Post Requirement
              </Button>
            </motion.div>
          )}

          {tab === 'requirements' && (
            <motion.div key="reqs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {myRequirements.length === 0 ? (
                <div className="py-16 text-center">
                  <ClipboardList size={40} className="mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">No requirements posted yet</p>
                  <Button onClick={() => setTab('post')} variant="outline" className="mt-4">Post Requirement</Button>
                </div>
              ) : (
                myRequirements.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card p-4 elevated-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{r.product}</h3>
                        <p className="text-xs text-muted-foreground">Qty: {r.quantity} · {r.urgency}</p>
                        {r.notes && <p className="mt-1 text-xs text-muted-foreground italic">{r.notes}</p>}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(r.status)}`}>
                        {r.status === 'open' ? 'Pending' : r.status === 'accepted' ? 'Accepted' : 'Completed'}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart size={40} className="mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                myOrders.map((o, i) => (
                  <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card p-4 elevated-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{o.product}</h3>
                        <p className="text-xs text-muted-foreground">{o.customerName} · Qty: {o.quantity}</p>
                        <p className="text-xs text-muted-foreground">{o.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    {o.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptOrder(o.id)} className="flex-1 gradient-primary border-0 text-primary-foreground text-xs">
                          <CheckCircle2 size={12} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectOrder(o.id)} className="flex-1 text-xs text-destructive border-destructive/30">
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {o.status === 'accepted' && (
                      <Button size="sm" onClick={() => handleDeliverOrder(o.id)} className="mt-3 w-full gradient-accent border-0 text-accent-foreground text-xs">
                        <Truck size={12} className="mr-1" /> Mark Delivered
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default RetailerDashboard;

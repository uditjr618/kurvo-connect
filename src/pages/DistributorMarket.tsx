import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Filter, CheckCircle2, Package, AlertTriangle, Store } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type FilterType = 'all' | 'Urgent' | 'Normal' | 'Low';

const DistributorMarket = () => {
  const { shops, updateShopStatus } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [tab, setTab] = useState<'shops' | 'requirements'>('shops');

  const filtered = filter === 'all' ? shops : shops.filter(s => s.urgency === filter);

  const demandColor = (d: string) => {
    switch (d) {
      case 'High': return 'bg-destructive/10 text-destructive';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-accent/10 text-accent';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const urgencyIcon = (u: string) => {
    if (u === 'Urgent') return <AlertTriangle size={12} className="text-destructive" />;
    return null;
  };

  const handleAccept = (id: string) => {
    updateShopStatus(id, 'accepted');
    toast.success('Requirement accepted!');
  };

  const handleFulfill = (id: string) => {
    updateShopStatus(id, 'fulfilled');
    toast.success('Marked as fulfilled!');
  };

  const handleContact = (phone: string, type: 'call' | 'whatsapp') => {
    const url = type === 'call' ? `tel:${phone}` : `https://wa.me/${phone.replace('+', '')}`;
    window.open(url, '_blank');
    toast.info(`Opening ${type === 'call' ? 'dialer' : 'WhatsApp'}...`);
  };

  return (
    <PageWrapper title="Market" subtitle="B2B shop demand & supply">
      <div className="px-5 py-4">
        {/* Tabs */}
        <div className="mb-4 flex rounded-xl bg-secondary p-1">
          {(['shops', 'requirements'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t === 'shops' ? 'Nearby Shops' : 'Requirements'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="shrink-0 text-muted-foreground" />
          {(['all', 'Urgent', 'Normal', 'Low'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {tab === 'shops' ? (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card p-4 elevated-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Store size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{s.shopName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={10} /> {s.shopDistance}
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${demandColor(s.demandLevel)}`}>
                    {s.demandLevel}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleContact(s.shopContact, 'call')} className="flex-1 touch-target text-xs">
                    <Phone size={12} className="mr-1" /> Call
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleContact(s.shopContact, 'whatsapp')} className="flex-1 touch-target text-xs">
                    <MessageCircle size={12} className="mr-1" /> WhatsApp
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card p-4 elevated-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {urgencyIcon(s.urgency)}
                      <h3 className="font-semibold text-foreground">{s.product}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.shopName} · Qty: {s.quantity}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    s.status === 'open' ? 'bg-yellow-100 text-yellow-700' : s.status === 'accepted' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                  }`}>
                    {s.status}
                  </span>
                </div>
                {s.status === 'open' && (
                  <Button size="sm" onClick={() => handleAccept(s.id)} className="mt-3 w-full gradient-primary border-0 text-primary-foreground touch-target text-xs">
                    Accept Requirement
                  </Button>
                )}
                {s.status === 'accepted' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleFulfill(s.id)} className="flex-1 gradient-accent border-0 text-accent-foreground touch-target text-xs">
                      <CheckCircle2 size={12} className="mr-1" /> Fulfilled
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleContact(s.shopContact, 'call')} className="flex-1 touch-target text-xs">
                      <Phone size={12} className="mr-1" /> Contact
                    </Button>
                  </div>
                )}
                {s.status === 'fulfilled' && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-accent font-medium">
                    <CheckCircle2 size={14} /> Delivered
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default DistributorMarket;

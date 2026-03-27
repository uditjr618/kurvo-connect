import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Package, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const RetailerProducts = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user, updatePoints } = useAuth();
  const { retailerShops, addOrder, addTransaction } = useApp();
  const [orderProduct, setOrderProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const shop = retailerShops.find(s => s.id === shopId);
  if (!shop || !user) return null;

  const handlePlaceOrder = () => {
    if (!orderProduct || !quantity) return;
    const prod = shop.products.find(p => p.id === orderProduct);
    if (!prod) return;

    addOrder({
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      retailerId: shop.id,
      retailerName: shop.name,
      product: prod.name,
      quantity: parseInt(quantity),
      deliveryType,
      address: deliveryType === 'delivery' ? address : shop.address,
    });

    const pts = 10;
    updatePoints(pts);
    addTransaction({ type: 'earn', amount: pts, description: `Order placed: ${prod.name}` });

    setShowSuccess(true);
    toast.success(`Order placed! +${pts} points`);
    setTimeout(() => {
      setShowSuccess(false);
      setOrderProduct(null);
      setQuantity('1');
      setAddress('');
    }, 2000);
  };

  return (
    <PageWrapper title={shop.name} subtitle={shop.address}>
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 size={48} className="text-accent" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Order Placed!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Track it in your orders</p>
              <Button onClick={() => navigate('/my-orders')} variant="outline" className="mt-4">View Orders</Button>
            </motion.div>
          ) : orderProduct ? (
            <motion.div key="order-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {(() => {
                const prod = shop.products.find(p => p.id === orderProduct);
                if (!prod) return null;
                return (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <h3 className="font-semibold text-foreground">{prod.name}</h3>
                    <p className="text-sm text-primary font-medium">₹{prod.price}</p>
                  </div>
                );
              })()}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Quantity</label>
                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Delivery Method</label>
                <div className="flex gap-2">
                  {(['delivery', 'pickup'] as const).map(d => (
                    <button key={d} onClick={() => setDeliveryType(d)} className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold capitalize transition-all ${deliveryType === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                      {d === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                    </button>
                  ))}
                </div>
              </div>
              {deliveryType === 'delivery' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Delivery Address</label>
                  <Input placeholder="Enter your address" value={address} onChange={e => setAddress(e.target.value)} className="h-12" />
                </div>
              )}
              <Button onClick={handlePlaceOrder} disabled={deliveryType === 'delivery' && !address.trim()} className="h-12 w-full text-base font-semibold gradient-primary border-0 text-primary-foreground">
                <ShoppingCart size={18} className="mr-2" /> Place Order
              </Button>
              <button onClick={() => setOrderProduct(null)} className="w-full text-sm text-muted-foreground">Back to products</button>
            </motion.div>
          ) : (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {shop.products.map((prod, i) => (
                <motion.div key={prod.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-card p-4 elevated-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Package size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{prod.name}</h3>
                        <p className="text-xs text-muted-foreground">{prod.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{prod.price}</p>
                      <span className={`text-[10px] font-semibold ${prod.available ? 'text-accent' : 'text-destructive'}`}>
                        {prod.available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  {prod.available && (
                    <Button size="sm" onClick={() => setOrderProduct(prod.id)} className="mt-3 w-full gradient-primary border-0 text-primary-foreground text-xs">
                      Buy Now <ChevronRight size={12} className="ml-1" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default RetailerProducts;

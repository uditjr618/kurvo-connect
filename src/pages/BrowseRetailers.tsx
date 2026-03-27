import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, ChevronRight, Store } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';

const BrowseRetailers = () => {
  const { retailerShops } = useApp();
  const navigate = useNavigate();

  return (
    <PageWrapper title="Nearby Shops" subtitle="Browse retailers near you">
      <div className="px-5 py-4 space-y-3">
        {retailerShops.map((shop, i) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card p-4 elevated-card"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Store size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{shop.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {shop.distance}</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> {shop.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{shop.address}</p>
                <p className="text-xs text-primary font-medium mt-1">{shop.products.filter(p => p.available).length} products available</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => navigate(`/shop/${shop.id}`)} className="flex-1 gradient-primary border-0 text-primary-foreground text-xs">
                View Products <ChevronRight size={12} className="ml-1" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(`tel:${shop.contact}`, '_blank')} className="text-xs">
                <Phone size={12} />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default BrowseRetailers;

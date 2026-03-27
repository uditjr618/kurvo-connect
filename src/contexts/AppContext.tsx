import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  description: string;
  date: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  location: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface ShopRequirement {
  id: string;
  shopName: string;
  shopDistance: string;
  shopContact: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  product: string;
  quantity: number;
  urgency: 'Urgent' | 'Normal' | 'Low';
  status: 'open' | 'accepted' | 'fulfilled';
}

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  shops: ShopRequirement[];
  updateShopStatus: (id: string, status: ShopRequirement['status']) => void;
}

const initialShops: ShopRequirement[] = [
  { id: 's1', shopName: 'Sharma Hardware', shopDistance: '1.2 km', shopContact: '+919876543210', demandLevel: 'High', product: 'CPVC Pipes 1"', quantity: 50, urgency: 'Urgent', status: 'open' },
  { id: 's2', shopName: 'Gupta Sanitary Store', shopDistance: '2.5 km', shopContact: '+919876543211', demandLevel: 'Medium', product: 'Ball Valves', quantity: 30, urgency: 'Normal', status: 'open' },
  { id: 's3', shopName: 'Patel Plumbing Center', shopDistance: '0.8 km', shopContact: '+919876543212', demandLevel: 'High', product: 'Water Tanks 500L', quantity: 10, urgency: 'Urgent', status: 'open' },
  { id: 's4', shopName: 'Krishna Enterprises', shopDistance: '3.1 km', shopContact: '+919876543213', demandLevel: 'Low', product: 'PVC Elbows', quantity: 100, urgency: 'Low', status: 'open' },
  { id: 's5', shopName: 'Raj Sanitary Mart', shopDistance: '1.8 km', shopContact: '+919876543214', demandLevel: 'Medium', product: 'Mixer Taps', quantity: 20, urgency: 'Normal', status: 'open' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const s = localStorage.getItem('kurvo_transactions');
    return s ? JSON.parse(s) : [];
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const s = localStorage.getItem('kurvo_bookings');
    return s ? JSON.parse(s) : [];
  });

  const [shops, setShops] = useState<ShopRequirement[]>(() => {
    const s = localStorage.getItem('kurvo_shops');
    return s ? JSON.parse(s) : initialShops;
  });

  useEffect(() => { localStorage.setItem('kurvo_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('kurvo_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('kurvo_shops', JSON.stringify(shops)); }, [shops]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    setTransactions(prev => [{ ...t, id: `t_${Date.now()}`, date: new Date().toISOString() }, ...prev]);
  };

  const addBooking = (b: Omit<Booking, 'id' | 'status'>) => {
    setBookings(prev => [{ ...b, id: `b_${Date.now()}`, status: 'pending' }, ...prev]);
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateShopStatus = (id: string, status: ShopRequirement['status']) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <AppContext.Provider value={{ transactions, addTransaction, bookings, addBooking, updateBookingStatus, shops, updateShopStatus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

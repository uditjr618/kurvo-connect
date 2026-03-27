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
  retailerId?: string;
  location?: string;
  notes?: string;
}

export interface RetailerProduct {
  id: string;
  retailerId: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
}

export interface RetailerShop {
  id: string;
  name: string;
  distance: string;
  contact: string;
  rating: number;
  address: string;
  products: RetailerProduct[];
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  retailerId: string;
  retailerName: string;
  product: string;
  quantity: number;
  deliveryType: 'delivery' | 'pickup';
  address: string;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered';
  date: string;
}

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  shops: ShopRequirement[];
  addShopRequirement: (s: Omit<ShopRequirement, 'id' | 'status'>) => void;
  updateShopStatus: (id: string, status: ShopRequirement['status']) => void;
  retailerShops: RetailerShop[];
  orders: CustomerOrder[];
  addOrder: (o: Omit<CustomerOrder, 'id' | 'status' | 'date'>) => void;
  updateOrderStatus: (id: string, status: CustomerOrder['status']) => void;
}

const initialShops: ShopRequirement[] = [
  { id: 's1', shopName: 'Sharma Hardware', shopDistance: '1.2 km', shopContact: '+919876543210', demandLevel: 'High', product: 'CPVC Pipes 1"', quantity: 50, urgency: 'Urgent', status: 'open' },
  { id: 's2', shopName: 'Gupta Sanitary Store', shopDistance: '2.5 km', shopContact: '+919876543211', demandLevel: 'Medium', product: 'Ball Valves', quantity: 30, urgency: 'Normal', status: 'open' },
  { id: 's3', shopName: 'Patel Plumbing Center', shopDistance: '0.8 km', shopContact: '+919876543212', demandLevel: 'High', product: 'Water Tanks 500L', quantity: 10, urgency: 'Urgent', status: 'open' },
  { id: 's4', shopName: 'Krishna Enterprises', shopDistance: '3.1 km', shopContact: '+919876543213', demandLevel: 'Low', product: 'PVC Elbows', quantity: 100, urgency: 'Low', status: 'open' },
  { id: 's5', shopName: 'Raj Sanitary Mart', shopDistance: '1.8 km', shopContact: '+919876543214', demandLevel: 'Medium', product: 'Mixer Taps', quantity: 20, urgency: 'Normal', status: 'open' },
];

const initialRetailerShops: RetailerShop[] = [
  {
    id: 'rs1', name: 'Sharma Hardware', distance: '1.2 km', contact: '+919876543210', rating: 4.5, address: 'MG Road, Sector 12',
    products: [
      { id: 'p1', retailerId: 'rs1', name: 'CPVC Pipe 1"', price: 120, available: true, category: 'Pipes' },
      { id: 'p2', retailerId: 'rs1', name: 'Ball Valve 1/2"', price: 85, available: true, category: 'Valves' },
      { id: 'p3', retailerId: 'rs1', name: 'PVC Elbow', price: 25, available: false, category: 'Fittings' },
    ],
  },
  {
    id: 'rs2', name: 'Gupta Sanitary Store', distance: '2.5 km', contact: '+919876543211', rating: 4.2, address: 'Station Road, Block C',
    products: [
      { id: 'p4', retailerId: 'rs2', name: 'Mixer Tap Chrome', price: 1450, available: true, category: 'Taps' },
      { id: 'p5', retailerId: 'rs2', name: 'Shower Head Rain', price: 890, available: true, category: 'Showers' },
      { id: 'p6', retailerId: 'rs2', name: 'Basin Set', price: 3200, available: true, category: 'Basins' },
    ],
  },
  {
    id: 'rs3', name: 'Patel Plumbing Center', distance: '0.8 km', contact: '+919876543212', rating: 4.7, address: 'Ring Road, Near Bus Stand',
    products: [
      { id: 'p7', retailerId: 'rs3', name: 'Water Tank 500L', price: 4500, available: true, category: 'Tanks' },
      { id: 'p8', retailerId: 'rs3', name: 'Submersible Pump', price: 6800, available: true, category: 'Pumps' },
      { id: 'p9', retailerId: 'rs3', name: 'PVC Pipe 2"', price: 180, available: true, category: 'Pipes' },
    ],
  },
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

  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const s = localStorage.getItem('kurvo_orders');
    return s ? JSON.parse(s) : [];
  });

  const [retailerShops] = useState<RetailerShop[]>(initialRetailerShops);

  useEffect(() => { localStorage.setItem('kurvo_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('kurvo_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('kurvo_shops', JSON.stringify(shops)); }, [shops]);
  useEffect(() => { localStorage.setItem('kurvo_orders', JSON.stringify(orders)); }, [orders]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    setTransactions(prev => [{ ...t, id: `t_${Date.now()}`, date: new Date().toISOString() }, ...prev]);
  };

  const addBooking = (b: Omit<Booking, 'id' | 'status'>) => {
    setBookings(prev => [{ ...b, id: `b_${Date.now()}`, status: 'pending' }, ...prev]);
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const addShopRequirement = (s: Omit<ShopRequirement, 'id' | 'status'>) => {
    setShops(prev => [{ ...s, id: `sr_${Date.now()}`, status: 'open' }, ...prev]);
  };

  const updateShopStatus = (id: string, status: ShopRequirement['status']) => {
    setShops(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const addOrder = (o: Omit<CustomerOrder, 'id' | 'status' | 'date'>) => {
    setOrders(prev => [{ ...o, id: `o_${Date.now()}`, status: 'pending', date: new Date().toISOString() }, ...prev]);
  };

  const updateOrderStatus = (id: string, status: CustomerOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <AppContext.Provider value={{ transactions, addTransaction, bookings, addBooking, updateBookingStatus, shops, addShopRequirement, updateShopStatus, retailerShops, orders, addOrder, updateOrderStatus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

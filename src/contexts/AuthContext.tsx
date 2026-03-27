import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'customer' | 'plumber' | 'distributor' | 'retailer';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  points: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, role: UserRole, name: string) => void;
  logout: () => void;
  updatePoints: (delta: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('kurvo_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('kurvo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kurvo_user');
    }
  }, [user]);

  const login = (phone: string, role: UserRole, name: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      phone,
      role,
      points: role === 'plumber' ? 200 : role === 'distributor' ? 500 : role === 'retailer' ? 300 : 100,
    };
    setUser(newUser);
  };

  const logout = () => setUser(null);

  const updatePoints = (delta: number) => {
    setUser(prev => prev ? { ...prev, points: Math.max(0, prev.points + delta) } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updatePoints }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

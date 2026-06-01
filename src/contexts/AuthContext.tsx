import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SbUser } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'plumber' | 'distributor' | 'retailer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  points: number;
  address: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: SbUser | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SbUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile + role for the current user
  const loadUserData = async (uid: string) => {
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', uid),
    ]);
    setProfile(p as Profile | null);
    const list = (roles ?? []).map((x: any) => x.role as UserRole);
    // Prefer admin if present, otherwise first role, else default customer
    const chosen: UserRole = list.includes('admin')
      ? 'admin'
      : (list[0] ?? 'customer');
    setRole(chosen);
  };

  useEffect(() => {
    // 1) Listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB calls to avoid deadlock
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    // 2) Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, signupRole: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role: signupRole },
      },
    });
    return error ? { error: error.message } : {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signInWithGoogle = async () => {
    const { lovable } = await import('@/integrations/lovable');
    await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/dashboard' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, profile, role, loading,
        isAuthenticated: !!session,
        signUp, signIn, signInWithGoogle, signOut, refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

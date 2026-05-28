import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, role, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone, address }).eq('id', user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
    await refreshProfile();
  };

  return (
    <PageWrapper>
      <div className="px-5 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Back</button>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><UserIcon size={28}/></div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.full_name || 'You'}</h1>
            <p className="text-sm text-muted-foreground capitalize">{role} · {user?.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div><Label>Full name</Label><Input value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-1.5 h-11"/></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1.5 h-11"/></div>
          <div><Label>Address</Label><Input value={address} onChange={e=>setAddress(e.target.value)} className="mt-1.5 h-11"/></div>
          <Button disabled={busy} onClick={save} className="h-11 w-full gradient-primary border-0 text-primary-foreground">{busy?'Saving…':'Save Changes'}</Button>
          <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }} className="h-11 w-full"><LogOut size={16} className="mr-1.5"/>Sign Out</Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfilePage;

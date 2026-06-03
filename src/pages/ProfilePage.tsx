import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, LogOut, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCurrentPosition } from '@/lib/geo';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, role, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setLat((profile as any).latitude ?? null);
      setLng((profile as any).longitude ?? null);
    }
  }, [profile]);

  const detectLocation = async () => {
    setLocBusy(true);
    try {
      const c = await getCurrentPosition();
      setLat(c.latitude); setLng(c.longitude);
      toast.success('Location captured — save to apply');
    } catch (e: any) {
      toast.error(e?.message || 'Could not get location');
    } finally { setLocBusy(false); }
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, phone, address, latitude: lat, longitude: lng,
    } as any).eq('id', user.id);
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
          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5"><MapPin size={14}/>My Location</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Not set — enable to find nearby plumbers & shops'}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={locBusy} onClick={detectLocation}>
                {locBusy ? <Loader2 size={14} className="animate-spin"/> : 'Use Current'}
              </Button>
            </div>
          </div>
          <Button disabled={busy} onClick={save} className="h-11 w-full gradient-primary border-0 text-primary-foreground">{busy?'Saving…':'Save Changes'}</Button>
          <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }} className="h-11 w-full"><LogOut size={16} className="mr-1.5"/>Sign Out</Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfilePage;

import { ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import NotificationsBell from '@/components/NotificationsBell';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <p className="text-xs text-muted-foreground">Kurvo</p>
                <h1 className="text-sm font-bold leading-none">Admin Console</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="hidden text-xs text-muted-foreground sm:inline">{profile?.full_name}</span>
              <NotificationsBell />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate('/'); }}>
                <LogOut size={18} />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children ?? <Outlet />}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Store, Truck, Wrench, Package, Tag, ShoppingBag,
  CalendarCheck, Gift, MessageSquareWarning, Boxes, ArrowLeftCircle, Bell,
} from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    items: [{ url: '/admin', icon: LayoutDashboard, title: 'Dashboard', end: true }],
  },
  {
    label: 'Users',
    items: [
      { url: '/admin/users', icon: Users, title: 'All Users' },
      { url: '/admin/users?role=customer', icon: Users, title: 'Customers' },
      { url: '/admin/users?role=retailer', icon: Store, title: 'Retailers' },
      { url: '/admin/users?role=distributor', icon: Truck, title: 'Distributors' },
      { url: '/admin/users?role=plumber', icon: Wrench, title: 'Plumbers' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { url: '/admin/products', icon: Package, title: 'Products' },
      { url: '/admin/categories', icon: Tag, title: 'Categories' },
      { url: '/admin/inventory', icon: Boxes, title: 'Inventory' },
      { url: '/admin/rewards', icon: Gift, title: 'Rewards' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { url: '/admin/orders', icon: ShoppingBag, title: 'Orders' },
      { url: '/admin/bookings', icon: CalendarCheck, title: 'Bookings' },
      { url: '/admin/requirements', icon: Truck, title: 'Requirements' },
      { url: '/admin/complaints', icon: MessageSquareWarning, title: 'Complaints' },
      { url: '/admin/notifications', icon: Bell, title: 'Notifications' },
      
    ],
  },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname, search } = useLocation();
  const current = pathname + search;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard size={16} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold leading-none">Kurvo</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const isActive = 'end' in item && item.end ? pathname === item.url : current === item.url;
                  return (
                    <SidebarMenuItem key={item.url + item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <NavLink to={item.url} end={(item as any).end}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard">
                    <ArrowLeftCircle className="h-4 w-4" />
                    {!collapsed && <span>Exit Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;

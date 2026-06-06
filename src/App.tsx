import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import EarnPoints from "@/pages/EarnPoints";
import WalletPage from "@/pages/WalletPage";
import BookPlumber from "@/pages/BookPlumber";
import PlumberJobs from "@/pages/PlumberJobs";
import RewardsStore from "@/pages/RewardsStore";
import DistributorMarket from "@/pages/DistributorMarket";
import RetailerDashboard from "@/pages/RetailerDashboard";
import BrowseRetailers from "@/pages/BrowseRetailers";
import RetailerProducts from "@/pages/RetailerProducts";
import CustomerOrders from "@/pages/CustomerOrders";
import CartPage from "@/pages/CartPage";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminRequirements from "@/pages/admin/AdminRequirements";
import AdminRewards from "@/pages/admin/AdminRewards";
import AdminComplaints from "@/pages/admin/AdminComplaints";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminNotifications from "@/pages/admin/AdminNotifications";

import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/earn" element={<ProtectedRoute><EarnPoints /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/book-plumber" element={<ProtectedRoute><BookPlumber /></ProtectedRoute>} />
        <Route path="/plumber-jobs" element={<ProtectedRoute roles={['plumber','admin']}><PlumberJobs /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><RewardsStore /></ProtectedRoute>} />
        <Route path="/market" element={<ProtectedRoute roles={['distributor','admin']}><DistributorMarket /></ProtectedRoute>} />
        <Route path="/retailer" element={<ProtectedRoute roles={['retailer','admin']}><RetailerDashboard /></ProtectedRoute>} />
        <Route path="/shops" element={<ProtectedRoute><BrowseRetailers /></ProtectedRoute>} />
        <Route path="/shop/:shopId" element={<ProtectedRoute><RetailerProducts /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminCategories /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminBookings /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/requirements" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminRequirements /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/rewards" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminRewards /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminComplaints /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminInventory /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isAuthenticated && !isAdminRoute && <BottomNav />}
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner richColors position="top-center" />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

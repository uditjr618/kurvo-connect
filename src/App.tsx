import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
import AdminPanel from "@/pages/AdminPanel";
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
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isAuthenticated && <BottomNav />}
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

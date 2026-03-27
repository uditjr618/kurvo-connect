import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import BottomNav from "@/components/BottomNav";
import LoginPage from "@/pages/LoginPage";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/earn" element={<ProtectedRoute><EarnPoints /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/book-plumber" element={<ProtectedRoute><BookPlumber /></ProtectedRoute>} />
        <Route path="/plumber-jobs" element={<ProtectedRoute><PlumberJobs /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><RewardsStore /></ProtectedRoute>} />
        <Route path="/market" element={<ProtectedRoute><DistributorMarket /></ProtectedRoute>} />
        <Route path="/retailer" element={<ProtectedRoute><RetailerDashboard /></ProtectedRoute>} />
        <Route path="/shops" element={<ProtectedRoute><BrowseRetailers /></ProtectedRoute>} />
        <Route path="/shop/:shopId" element={<ProtectedRoute><RetailerProducts /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isAuthenticated && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

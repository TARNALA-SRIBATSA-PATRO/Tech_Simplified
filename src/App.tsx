import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserAuthProvider } from "@/lib/UserAuthContext";
import Index from "./pages/Index";
import BlogDetail from "./pages/BlogDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserLogin from "./pages/UserLogin";
import UserDashboard from "./pages/UserDashboard";
import WriteBlog from "./pages/WriteBlog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserAuthProvider>
        <BrowserRouter>
          {/* Full-height flex column — makes footer always stick to bottom */}
          <div className="flex flex-col min-h-screen">
            {/* Navbar: sticky so it stays at top while scrolling */}
            <Navbar />

            {/* Main content: flex-1 forces it to grow and fill remaining space */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/blog/:id" element={<BlogDetail />} />
                {/* User auth & profile */}
                <Route path="/login" element={<UserLogin />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/write-blog" element={<WriteBlog />} />
                {/* Admin */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            {/* Footer: always at the bottom */}
            <Footer />
          </div>
        </BrowserRouter>
      </UserAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

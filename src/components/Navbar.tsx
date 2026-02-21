import { Flame, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { adminLogout } from '@/lib/store';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminDashboard = location.pathname === '/admin/dashboard';

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {isAdminDashboard ? (
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold leading-snug">
              Welcome back, <span className="text-gradient">Sribatsa</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Every word you write today is a step closer to inspiring someone. Keep creating!
            </p>
          </div>
        ) : (
          <a href="/" className="flex items-center gap-2 font-bold text-xl">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-gradient">Tech Simplified</span>
          </a>
        )}

        {isAdminDashboard && (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        )}
      </div>
    </header>
  );
}

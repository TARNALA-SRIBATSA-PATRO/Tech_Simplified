import { LogOut } from 'lucide-react';
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
      <div className="container mx-auto flex h-auto min-h-16 items-center justify-between px-4 py-3 gap-3">
        {isAdminDashboard ? (
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold leading-snug truncate">
              Welcome back, <span className="text-gradient">Sribatsa</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Every word you write today is a step closer to inspiring someone. Keep creating!
            </p>
          </div>
        ) : (
          <a href="/" className="font-bold text-xl shrink-0">
            <span className="text-gradient">Tech Simplified</span>
          </a>
        )}

        {isAdminDashboard && (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground shrink-0 px-2 sm:px-4"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}

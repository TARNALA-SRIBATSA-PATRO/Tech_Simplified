import { useState, useRef, useEffect } from 'react';
import { LogOut, Pencil, Bell, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { adminLogout } from '@/lib/store';
import { useUserAuth } from '@/lib/UserAuthContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUserAuth();
  const isAdminDashboard = location.pathname === '/admin/dashboard';

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdminLogout = () => { adminLogout(); navigate('/admin'); };
  const handleUserLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-auto min-h-16 items-center justify-between px-4 py-3 gap-3">

          {/* Left: Logo or Admin title */}
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
            <Link to="/" className="font-bold text-xl shrink-0">
              <span className="text-gradient">Tech Simplified</span>
            </Link>
          )}

          {/* Right: Admin logout OR user profile */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdminDashboard ? (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground shrink-0 px-2 sm:px-4"
                onClick={() => setLogoutOpen(true)}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : isLoggedIn && user ? (
              <>
                {/* Write Blog shortcut */}
                <Button asChild variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground hover:text-primary">
                  <Link to="/write-blog"><Pencil className="h-4 w-4" />Write</Link>
                </Button>

                {/* User avatar dropdown */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5
                      hover:bg-secondary transition-colors border border-transparent hover:border-border/50"
                  >
                    {user.profilePhotoBase64 ? (
                      <img src={user.profilePhotoBase64} alt=""
                        className="w-7 h-7 rounded-full object-cover border border-border/50 shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center
                        text-primary font-bold text-xs border border-primary/30 shrink-0">
                        {getInitials(user.displayName)}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                      {user.displayName}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-sm font-semibold truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {/* Menu items */}
                      <div className="py-1">
                        <Link to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />My Dashboard
                        </Link>
                        <Link to="/write-blog"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                          <Pencil className="h-4 w-4 text-muted-foreground" />Write Blog
                        </Link>
                        <Link to="/dashboard?tab=notifications"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                          <Bell className="h-4 w-4 text-muted-foreground" />Notifications
                        </Link>
                        <Link to="/dashboard?tab=help"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                          <User className="h-4 w-4 text-muted-foreground" />Help & Feedback
                        </Link>
                      </div>
                      <div className="py-1 border-t border-border/50">
                        <button
                          onClick={handleUserLogout}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left
                            text-destructive hover:bg-destructive/10 transition-colors">
                          <LogOut className="h-4 w-4" />Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Not logged in — show Sign In */
              !isAdminDashboard && (
                <Button asChild size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                  <Link to="/login">Sign In</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Admin logout confirmation */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="bg-card border-border w-[calc(100vw-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of the admin dashboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleAdminLogout}
            >
              Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

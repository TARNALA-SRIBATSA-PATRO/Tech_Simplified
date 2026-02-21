import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-gradient">BlogFire</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

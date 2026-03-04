import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl sm:text-8xl font-extrabold text-primary">404</h1>
        <p className="mb-2 text-xl sm:text-2xl font-semibold">Page not found</p>
        <p className="mb-6 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <a
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

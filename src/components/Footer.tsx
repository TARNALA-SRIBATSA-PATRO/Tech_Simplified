export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-background/80">

      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {year}{' '}
            <span className="text-gradient font-semibold">Tech Simplified</span>
            {' '}· All rights reserved.
          </p>
          <p>
            Built by{' '}
            <a
              href="https://sribatsa.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Tarnala Sribatsa Patro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

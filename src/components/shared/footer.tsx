export function Footer() {
  return (
    <footer className="border-t-4 border-primary bg-card p-3 md:p-4 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] md:text-xs text-muted-foreground">
            &copy; 2025 True Champion. Fantasy Football Truth Revealed.
          </p>

          <div className="flex items-center gap-4 text-[10px] md:text-xs">
            <span className="text-muted-foreground">
              Powered by ESPN Fantasy API
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              Updates Every Tuesday
            </span>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground/60">
            Built with Next.js, Tailwind, and Retro Bowl vibes
          </p>
        </div>
      </div>
    </footer>
  );
}

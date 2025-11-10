import Link from "next/link";

export function Header() {
  return (
    <header className="border-b-4 border-primary bg-card p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <h1 className="text-xl md:text-2xl text-primary text-retro">
              TRUE CHAMPION
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm hover:text-primary transition-colors"
            >
              STANDINGS
            </Link>
            <Link
              href="/weeks"
              className="text-sm hover:text-primary transition-colors"
            >
              WEEKS
            </Link>
            <Link
              href="/about"
              className="text-sm hover:text-primary transition-colors"
            >
              ABOUT
            </Link>
          </nav>
        </div>

        <p className="text-xs mt-2 text-muted-foreground">
          Who's the REAL champion? Not who got lucky.
        </p>
      </div>
    </header>
  );
}

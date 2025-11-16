"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { TeamsNav } from "./teams-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      className="sticky top-0 z-50 border-b-4 border-primary bg-card p-3 md:p-4 backdrop-blur-sm supports-backdrop-filter:bg-card/95"
      role="banner"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <h1 className="text-xl md:text-2xl text-primary text-retro">
              TRUE CHAMPION
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" role="navigation" aria-label="Main navigation">
            <Link
              href="/dashboard"
              className="text-sm hover:text-primary transition-colors py-3"
              aria-current={pathname === '/dashboard' ? 'page' : undefined}
            >
              STANDINGS
            </Link>
            {user ? (
              <TeamsNav />
            ) : (
              <Link
                href="/demo"
                className="text-sm hover:text-primary transition-colors py-3"
                aria-current={pathname === '/demo' ? 'page' : undefined}
              >
                DEMO
              </Link>
            )}
            <Link
              href="/weeks"
              className="text-sm hover:text-primary transition-colors py-3"
              aria-current={pathname === '/weeks' ? 'page' : undefined}
            >
              WEEKS
            </Link>
            <Link
              href="/about"
              className="text-sm hover:text-primary transition-colors py-3"
              aria-current={pathname === '/about' ? 'page' : undefined}
            >
              ABOUT
            </Link>
            {!loading && (
              user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="retro-button border-primary text-xs text-primary hover:bg-primary/10"
                  onClick={handleSignOut}
                >
                  SIGN OUT
                </Button>
              ) : (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="retro-button border-primary text-xs text-primary hover:bg-primary/10"
                  >
                    SIGN IN
                  </Button>
                </Link>
              )
            )}
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>

        <p className="text-[10px] sm:text-xs mt-2 text-muted-foreground-accessible">
          Who's the REAL champion? Not who got lucky.
        </p>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TeamsNavMobile } from "./teams-nav-mobile";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "STANDINGS" },
    { href: "/weeks", label: "WEEKS" },
    { href: "/about", label: "ABOUT" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="md:hidden p-2 h-auto"
          aria-label="Open navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] bg-card border-l-4 border-primary overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-primary text-retro text-left">
            MENU
          </SheetTitle>
          <SheetDescription className="text-left text-xs">
            Navigate to different sections
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm hover:text-primary transition-colors py-3 px-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 min-h-11 flex items-center"
            >
              {item.label}
            </Link>
          ))}
          <TeamsNavMobile onNavigate={() => setOpen(false)} />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
          >
            <Button
              className="retro-button w-full border-2 border-primary bg-primary/20 text-primary hover:bg-primary/30"
            >
              SIGN IN
            </Button>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

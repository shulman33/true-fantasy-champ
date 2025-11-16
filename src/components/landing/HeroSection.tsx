"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Check } from "lucide-react";

export function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative px-3 py-6 md:px-4 md:py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Hero Content */}
        <div className="retro-card scanlines relative overflow-hidden border-primary bg-card/95 p-4 md:p-8 lg:p-12">
          {/* Season Badge - Stacked on mobile, absolute on desktop */}
          <div className="mb-4 flex justify-center md:absolute md:right-6 md:top-6 md:mb-0">
            <div className="retro-card border-2 border-retro-yellow bg-retro-yellow/20 px-3 py-1.5 md:px-4 md:py-2">
              <span className="text-[10px] font-bold text-retro-yellow md:text-xs">
                SEASON 2025
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="mb-4 text-center md:mb-8 md:text-left">
            <h1 className="mb-2 text-xl leading-tight text-primary md:mb-4 md:text-3xl lg:text-4xl">
              FIND YOUR
              <br />
              LEAGUE&apos;S
              <br className="md:hidden" />
              <span className="md:inline"> </span>
              <span className="text-retro-yellow">TRUE</span>
              <br />
              <span className="text-retro-yellow">CHAMPION</span>
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground md:text-base lg:text-lg">
              Who would win if everyone played everyone each week?
            </p>
          </div>

          {/* Description */}
          <div className="mb-6 max-w-3xl space-y-2 text-center text-[10px] leading-relaxed text-foreground/90 md:mb-10 md:space-y-3 md:text-left md:text-sm lg:text-base">
            <p>
              Your fantasy football league has a dirty little secret: the
              champion might just be the luckiest person in your league, not the
              best. Week after week, teams dodge bullets while facing weak
              opponents while powerhouse teams cannibalize each other.
            </p>
            <p className="hidden md:block">
              <span className="text-primary">True Champion</span> calculates what
              each team&apos;s record would be if they played{" "}
              <span className="text-retro-yellow">EVERY</span> other team{" "}
              <span className="text-retro-yellow">EVERY</span> week. No more
              schedule luck. Just pure performance.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4 md:justify-start">
            <Link href="/signup" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="retro-button flex h-auto w-full items-center justify-center gap-2 bg-primary py-3 text-[10px] text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-8 md:text-sm"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                CONNECT YOUR LEAGUE
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToFeatures}
              className="retro-button h-auto w-full border-primary py-3 text-[10px] text-primary hover:bg-primary/10 sm:w-auto sm:px-8 md:text-sm"
            >
              SEE HOW IT WORKS
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-4 flex flex-col items-center gap-2 text-[9px] text-muted-foreground md:mt-8 md:flex-row md:items-center md:gap-4 md:text-xs">
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" aria-hidden="true" />
              <span>ESPN/Sleeper/Yahoo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

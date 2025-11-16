import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Check } from "lucide-react";

export function DemoPreview() {
  return (
    <section className="px-3 py-6 md:px-4 md:py-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="retro-card crt-effect relative overflow-hidden border-primary bg-card/95 p-4 md:p-8 lg:p-10">
          {/* Scanlines */}
          <div className="scanlines pointer-events-none absolute inset-0" />

          {/* Content */}
          <div className="relative text-center">
            {/* Icon */}
            <div className="mb-4 flex justify-center md:mb-6">
              <Trophy className="h-12 w-12 text-retro-yellow md:h-16 md:w-16" aria-hidden="true" />
            </div>

            {/* Headline */}
            <h2 className="mb-2 text-lg text-primary md:mb-4 md:text-2xl lg:text-3xl">
              SEE IT IN
              <br className="md:hidden" />
              <span className="md:inline"> </span>
              ACTION
            </h2>

            <p className="mx-auto mb-4 max-w-xl text-[10px] leading-relaxed text-foreground/80 md:mb-8 md:text-sm">
              Explore a fully functional demo league with real-looking data. See
              exactly how True Champion reveals the most deserving team. No
              signup required.
            </p>

            {/* Demo Features */}
            <div className="mb-4 space-y-1.5 text-[10px] text-muted-foreground md:mb-8 md:space-y-2 md:text-sm">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>Interactive standings table</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>Week-by-week analysis</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>Luck vs skill insights</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link href="/demo">
              <Button
                size="lg"
                className="retro-button flex h-auto w-full items-center justify-center gap-2 bg-primary py-3 text-[10px] text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-12 md:text-sm"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                EXPLORE DEMO LEAGUE
              </Button>
            </Link>

            {/* Small text */}
            <p className="mt-3 text-[9px] text-muted-foreground md:mt-4 md:text-xs">
              Get the full experience without connecting your league
            </p>
          </div>

          {/* Decorative corners */}
          <div className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-retro-yellow md:h-3 md:w-3" />
          <div className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-retro-yellow md:h-3 md:w-3" />
          <div className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-retro-yellow md:h-3 md:w-3" />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-retro-yellow md:h-3 md:w-3" />
        </div>
      </div>
    </section>
  );
}

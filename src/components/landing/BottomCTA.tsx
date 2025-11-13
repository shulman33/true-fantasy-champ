import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BottomCTA() {
  return (
    <section className="px-3 py-8 md:px-4 md:py-16 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="retro-card relative overflow-hidden border-primary bg-gradient-to-br from-card/95 to-card/80 p-5 text-center md:p-12 lg:p-16">
          {/* Scanlines effect */}
          <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />

          {/* Content */}
          <div className="relative">
            {/* Trophy Icon */}
            <div className="mb-4 text-5xl md:mb-6 md:text-7xl lg:text-8xl">🏆</div>

            {/* Headline */}
            <h2 className="mb-3 text-lg leading-tight text-primary md:mb-6 md:text-3xl lg:text-4xl">
              READY TO
              <br />
              CROWN YOUR
              <br />
              <span className="text-retro-yellow">TRUE</span>
              <br className="md:hidden" />
              <span className="md:inline"> </span>
              <span className="text-retro-yellow">CHAMPION?</span>
            </h2>

            {/* Description */}
            <p className="mx-auto mb-6 max-w-2xl text-[10px] leading-relaxed text-foreground/80 md:mb-10 md:text-sm lg:text-base">
              Stop letting schedule luck decide your league champion. Connect
              your ESPN league now and reveal who truly deserves the title.
            </p>

            {/* CTA Button */}
            <div className="mb-4 md:mb-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="retro-button h-auto w-full bg-primary py-3 text-[10px] text-primary-foreground hover:bg-primary/90 sm:w-auto sm:px-12 md:px-12 md:py-6 md:text-base lg:px-16"
                >
                  🏈 SIGN UP FREE
                </Button>
              </Link>
            </div>

            {/* Sign In Link */}
            <p className="text-[10px] text-muted-foreground md:text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary underline decoration-primary/50 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary"
              >
                Sign in
              </Link>
            </p>

            {/* Trust Indicators */}
            <div className="mt-5 flex flex-col gap-2 text-[9px] text-muted-foreground md:mt-8 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-6 md:text-xs">
              <div className="flex items-center justify-center gap-2">
                <span className="text-primary">✓</span>
                <span>100% Free</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-primary">✓</span>
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-primary">✓</span>
                <span>Setup in 2 Minutes</span>
              </div>
            </div>
          </div>

          {/* Decorative glow effect */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        </div>
      </div>
    </section>
  );
}

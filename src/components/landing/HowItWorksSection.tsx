interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "1",
    title: "CONNECT YOUR ESPN LEAGUE",
    description:
      "Integration with your Fantasy Football league. Safe and secure.",
  },
  {
    number: "2",
    title: "WE CALCULATE TRUE RECORDS",
    description:
      "Our algorithm runs every matchup combination and updates automatically each week.",
  },
  {
    number: "3",
    title: "CROWN THE REAL CHAMPION",
    description:
      "See who truly dominated your league with consistent performance, not lucky breaks.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-4 py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-3 text-xl text-primary md:text-2xl lg:text-3xl">
            HOW IT WORKS
          </h2>
          <p className="mx-auto max-w-2xl text-xs text-muted-foreground md:text-sm">
            Get started in minutes
          </p>
        </div>

        {/* Steps */}
        <div className="relative space-y-6 md:space-y-8">
          {STEPS.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting Line (desktop only, except for last item) */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-6 top-16 hidden h-full w-0.5 bg-primary/30 md:left-8 md:block" />
              )}

              {/* Step Card */}
              <div className="retro-card relative flex flex-col gap-4 border-primary bg-card/90 p-6 md:flex-row md:items-start md:gap-6 md:p-8">
                {/* Step Number Badge */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="retro-card inline-block border-2 border-retro-yellow bg-retro-yellow/20 px-4 py-2 md:px-6 md:py-3">
                    <span className="text-lg font-bold text-retro-yellow md:text-xl lg:text-2xl">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3 className="mb-2 text-sm text-primary md:mb-3 md:text-base lg:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-foreground/80 md:text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Decorative Arrow (mobile only) */}
                {index < STEPS.length - 1 && (
                  <div className="mx-auto mt-4 flex h-8 w-8 items-center justify-center text-xl text-primary/50 md:hidden">
                    ↓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="mt-8 text-center md:mt-12">
          <div className="retro-card inline-block border-primary bg-card/50 px-6 py-3 md:px-8 md:py-4">
            <p className="text-xs text-muted-foreground md:text-sm">
              <span className="text-primary">⚡</span> Updates automatically every
              Tuesday
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

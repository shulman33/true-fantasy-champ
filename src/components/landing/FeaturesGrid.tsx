import Link from "next/link";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: "📊",
    title: "TRUE RECORDS",
    description:
      "See what your record would be if you played everyone, every single week. The truth revealed.",
  },
  {
    icon: "🍀",
    title: "LUCK METER",
    description:
      "Find out who's been riding their lucky schedule and who's been robbed by fate.",
  },
  {
    icon: "📅",
    title: "WEEKLY BREAKDOWN",
    description:
      "Dive into every week to see hypothetical matchups and how you would've fared.",
  },
  {
    icon: "🏆",
    title: "TRUE CHAMPION",
    description:
      "Crown the team that deserves it most. Consistent, dominant performance.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="px-4 py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-3 text-xl text-primary md:text-2xl lg:text-3xl">
            WELCOME TO THE TRUTH
          </h2>
          <p className="mx-auto max-w-2xl text-xs text-muted-foreground md:text-sm lg:text-base">
            Stop letting luck decide your champion
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="retro-card group relative overflow-hidden border-primary bg-card/90 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg hover:shadow-primary/20 md:p-8"
            >
              {/* Scanlines effect */}
              <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className="mb-4 text-3xl md:text-4xl">{feature.icon}</div>

                {/* Title */}
                <h3 className="mb-3 text-sm text-primary md:text-base lg:text-lg">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xs leading-relaxed text-foreground/80 md:text-sm">
                  {feature.description}
                </p>

                {/* Decorative corner pixels */}
                <div className="absolute -right-1 -top-1 h-2 w-2 bg-primary opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-primary opacity-50 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Demo CTA */}
        <div className="mt-8 text-center md:mt-12">
          <p className="mb-4 text-xs text-muted-foreground md:text-sm">
            Want to see it in action?
          </p>
          <Link
            href="/demo"
            className="retro-button inline-block border-2 border-retro-yellow bg-retro-yellow/20 px-6 py-3 text-xs text-retro-yellow transition-all hover:bg-retro-yellow/30 md:px-8 md:text-sm"
          >
            🎮 TRY DEMO LEAGUE
          </Link>
        </div>
      </div>
    </section>
  );
}

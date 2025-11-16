import { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy,
  Calculator,
  BarChart3,
  Zap,
  Users,
  Calendar,
  ChevronRight,
  GitBranch,
  Database,
  Code
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | True Champion',
  description: 'Learn how True Champion reveals who really deserves to win your fantasy football league by eliminating schedule luck.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-12 md:space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-block">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-4" />
        </div>
        <h1 className="text-2xl md:text-4xl lg:text-5xl text-retro text-primary">
          ABOUT TRUE CHAMPION
        </h1>
        <p className="text-sm md:text-base max-w-2xl mx-auto text-muted-foreground">
          Discover who the REAL champion is in your fantasy football league—not just who got lucky with their schedule.
        </p>
      </section>

      {/* The Problem Section */}
      <section className="retro-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-destructive" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            THE PROBLEM
          </h2>
        </div>
        <p className="text-sm md:text-base leading-relaxed">
          In traditional fantasy football, your record depends heavily on <span className="text-accent font-bold">schedule luck</span>.
          You could score the second-most points in your league every week and still have a losing record if you
          keep matching up against the highest scorer.
        </p>
        <p className="text-sm md:text-base leading-relaxed">
          Meanwhile, someone with mediocre scores might be undefeated just because they faced the right opponents.
          <span className="text-destructive font-bold"> That's not fair. That's not who the true champion is.</span>
        </p>
      </section>

      {/* The Solution Section */}
      <section className="retro-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-8 h-8 text-primary" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            THE SOLUTION
          </h2>
        </div>
        <p className="text-sm md:text-base leading-relaxed">
          True Champion calculates what your record <span className="text-accent font-bold">would have been</span> if
          you played against every other team in your league, every single week.
        </p>
        <p className="text-sm md:text-base leading-relaxed">
          Instead of just one matchup per week, we compute all possible matchups. This reveals your{' '}
          <span className="text-primary font-bold">"true record"</span>—a much more accurate measure of your team's
          actual performance throughout the season.
        </p>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-accent" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            HOW IT WORKS
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Step 1 */}
          <div className="retro-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground border-2 border-foreground">
                <span className="text-lg font-bold">1</span>
              </div>
              <h3 className="text-base md:text-lg text-retro">FETCH DATA</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We pull your league's weekly scores from the ESPN Fantasy Football API.
            </p>
          </div>

          {/* Step 2 */}
          <div className="retro-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground border-2 border-foreground">
                <span className="text-lg font-bold">2</span>
              </div>
              <h3 className="text-base md:text-lg text-retro">COMPARE ALL</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              For each week, we compare every team's score against all other teams in the league.
            </p>
          </div>

          {/* Step 3 */}
          <div className="retro-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground border-2 border-foreground">
                <span className="text-lg font-bold">3</span>
              </div>
              <h3 className="text-base md:text-lg text-retro">CALCULATE</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We tally wins and losses for each hypothetical matchup and accumulate them throughout the season.
            </p>
          </div>

          {/* Step 4 */}
          <div className="retro-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground border-2 border-foreground">
                <span className="text-lg font-bold">4</span>
              </div>
              <h3 className="text-base md:text-lg text-retro">REVEAL TRUTH</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Display the true standings, revealing who really performed best and who benefited from schedule luck.
            </p>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="retro-card p-6 md:p-8 space-y-4 bg-accent/10">
          <h3 className="text-base md:text-lg text-retro text-accent">EXAMPLE CALCULATION</h3>
          <div className="space-y-2 text-sm md:text-base">
            <p className="leading-relaxed">
              <span className="text-primary font-bold">Week 1:</span> Team A scores 120 points
            </p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• vs Team B (110 pts) → <span className="text-primary">Win</span></li>
              <li>• vs Team C (130 pts) → <span className="text-destructive">Loss</span></li>
              <li>• vs Team D (105 pts) → <span className="text-primary">Win</span></li>
              <li>• vs Team E (125 pts) → <span className="text-destructive">Loss</span></li>
            </ul>
            <p className="leading-relaxed pt-2">
              <span className="text-accent font-bold">True Record for Week 1:</span> 2-2 (50% win rate)
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="retro-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-8 h-8 text-accent" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            WHY IT MATTERS
          </h2>
        </div>
        <div className="space-y-4 text-sm md:text-base">
          <p className="leading-relaxed">
            True Champion helps you discover:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span><span className="text-accent font-bold">Luckiest Teams:</span> Who's winning despite average performance</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span><span className="text-accent font-bold">Unluckiest Teams:</span> Who deserves better based on consistent scoring</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span><span className="text-accent font-bold">True Performance:</span> Rankings based on merit, not matchup randomness</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span><span className="text-accent font-bold">Season Insights:</span> Week-by-week analysis of team consistency</span>
            </li>
          </ul>
          <p className="leading-relaxed pt-2">
            Whether you're dominating or struggling, True Champion shows you where you{' '}
            <span className="text-primary font-bold">really</span> stand.
          </p>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Code className="w-8 h-8 text-primary" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            TECHNOLOGY STACK
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Frontend */}
          <div className="retro-card p-6 space-y-3">
            <GitBranch className="w-8 h-8 text-accent mb-2" />
            <h3 className="text-base md:text-lg text-retro">FRONTEND</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Next.js 15</li>
              <li>• React 18</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• shadcn/ui</li>
            </ul>
          </div>

          {/* Backend */}
          <div className="retro-card p-6 space-y-3">
            <Database className="w-8 h-8 text-accent mb-2" />
            <h3 className="text-base md:text-lg text-retro">BACKEND</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Upstash Redis</li>
              <li>• ESPN Fantasy API</li>
              <li>• Vercel Cron Jobs</li>
              <li>• Zod Validation</li>
            </ul>
          </div>

          {/* Deployment */}
          <div className="retro-card p-6 space-y-3">
            <Zap className="w-8 h-8 text-accent mb-2" />
            <h3 className="text-base md:text-lg text-retro">DEPLOYMENT</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Vercel</li>
              <li>• Edge Functions</li>
              <li>• Auto Updates</li>
              <li>• Global CDN</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About Creator Section */}
      <section className="retro-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-primary" />
          <h2 className="text-xl md:text-2xl text-retro text-primary">
            ABOUT THE CREATOR
          </h2>
        </div>
        <p className="text-sm md:text-base leading-relaxed">
          True Champion was created by <span className="text-accent font-bold">Sam Shulman</span>, a fantasy football
          enthusiast and developer who got tired of losing matchups despite having consistently high scores.
        </p>
        <p className="text-sm md:text-base leading-relaxed">
          After one too many "unlucky" seasons, Sam built this tool to settle the debate once and for all:
          <span className="text-primary font-bold"> who's REALLY the best team?</span>
        </p>
      </section>

      {/* Bottom CTA */}
      <section className="retro-card p-8 md:p-12 text-center space-y-6 bg-primary/10 border-primary">
        <h2 className="text-xl md:text-3xl text-retro text-primary">
          READY TO FIND YOUR TRUE CHAMPION?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Connect your ESPN Fantasy Football league and discover who really deserves to be champion.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/dashboard"
            className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-sm md:text-base border-2 border-foreground inline-flex items-center gap-2"
          >
            VIEW STANDINGS
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/demo"
            className="retro-button bg-background hover:bg-accent/20 px-8 py-3 text-sm md:text-base border-2 border-foreground inline-flex items-center gap-2"
          >
            TRY DEMO
          </Link>
        </div>
      </section>
    </div>
  );
}

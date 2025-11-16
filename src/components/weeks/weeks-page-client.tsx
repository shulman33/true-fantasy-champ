'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { LoadingCard } from '@/components/shared/loading-skeleton';

interface CurrentWeekInfo {
  currentWeek: number;
  lastCompletedWeek: number;
  maxWeek: number;
  totalWeeks: number;
}

export function WeeksPageClient() {
  const [weekInfo, setWeekInfo] = useState<CurrentWeekInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentWeek() {
      try {
        const response = await fetch('/api/current-week', {
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setWeekInfo(data);
        } else {
          // Fallback to showing all weeks
          setWeekInfo({
            currentWeek: 18,
            lastCompletedWeek: 18,
            maxWeek: 18,
            totalWeeks: 18,
          });
        }
      } catch (error) {
        console.error('Error fetching current week:', error);
        // Fallback to showing all weeks
        setWeekInfo({
          currentWeek: 18,
          lastCompletedWeek: 18,
          maxWeek: 18,
          totalWeeks: 18,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentWeek();
  }, []);

  if (loading || !weekInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingCard />
      </div>
    );
  }

  const { currentWeek, maxWeek, totalWeeks } = weekInfo;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="retro-card bg-background/95">
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl uppercase tracking-wider flex flex-col items-center justify-center gap-2">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Select a Week
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            View detailed analysis, scores, and hypothetical matchups for any week
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const isCurrent = week === currentWeek;
              const isCompleted = week <= maxWeek;
              const isPast = week < currentWeek;

              // Disable upcoming weeks that don't have data yet
              if (!isCompleted) {
                return (
                  <Card
                    key={week}
                    className="retro-card border-muted bg-muted/10 opacity-50 cursor-not-allowed"
                  >
                    <CardContent className="p-3 md:p-6 text-center">
                      <div className="mb-2">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6 mx-auto text-muted-foreground" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-retro mb-1 text-muted-foreground">
                        {week}
                      </div>
                      <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-tight md:tracking-wider px-1">
                        Upcoming
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Link key={week} href={`/week/${week}`} className="block">
                  <Card
                    className={`retro-card hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all ${
                      isCurrent
                        ? 'border-accent bg-accent/10'
                        : isPast
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-muted/20'
                    }`}
                  >
                    <CardContent className="p-3 md:p-6 text-center">
                      <div className="mb-2">
                        {isCurrent ? (
                          <TrendingUp className="h-5 w-5 md:h-6 md:w-6 mx-auto text-accent" />
                        ) : isPast ? (
                          <BarChart3 className="h-5 w-5 md:h-6 md:w-6 mx-auto text-primary" />
                        ) : (
                          <Calendar className="h-5 w-5 md:h-6 md:w-6 mx-auto text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`text-2xl md:text-3xl font-bold text-retro mb-1 ${
                          isCurrent
                            ? 'text-accent'
                            : isPast
                              ? 'text-primary'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {week}
                      </div>
                      <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-tight md:tracking-wider px-1">
                        {isCurrent ? 'Current' : isPast ? 'Completed' : 'Upcoming'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Access Buttons */}
          <div className="mt-8 pt-6 border-t border-primary/30">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4 text-center">
              Quick Access
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center px-2">
              {maxWeek > 0 && (
                <Link href={`/week/${maxWeek}`}>
                  <Button className="retro-button bg-primary text-primary-foreground text-xs sm:text-sm whitespace-nowrap">
                    <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Latest </span>Week {maxWeek}
                  </Button>
                </Link>
              )}
              <Link href={`/week/1`}>
                <Button variant="outline" className="retro-button text-xs sm:text-sm">
                  Week 1
                </Button>
              </Link>
              {maxWeek > 1 && (
                <Link href={`/week/${maxWeek - 1}`}>
                  <Button variant="outline" className="retro-button text-xs sm:text-sm whitespace-nowrap">
                    <span className="hidden sm:inline">Previous </span>Week {maxWeek - 1}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="retro-card bg-background/95 mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">
            About Weekly Analysis
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Weekly Scoreboard:</strong> See
              how all teams performed in a specific week, ranked by score.
            </p>
            <p>
              <strong className="text-foreground">Hypothetical Matchups:</strong>{' '}
              View what would happen if every team played every other team that
              week.
            </p>
            <p>
              <strong className="text-foreground">Stats Summary:</strong> Highest
              and lowest scores, averages, and interesting insights for each week.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavigatorProps {
  currentWeek: number;
  totalWeeks: number;
}

export function WeekNavigator({ currentWeek, totalWeeks }: WeekNavigatorProps) {
  const hasPrevious = currentWeek > 1;
  const hasNext = currentWeek < totalWeeks;

  return (
    <div className="retro-card bg-background/95 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        {/* Previous Week Button */}
        <div className="flex-1">
          {hasPrevious ? (
            <Link href={`/week/${currentWeek - 1}`}>
              <Button
                variant="outline"
                className="retro-button w-full md:w-auto"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Week {currentWeek - 1}</span>
                <span className="sm:hidden">Prev</span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="retro-button w-full md:w-auto opacity-50 cursor-not-allowed"
              disabled
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">No Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
          )}
        </div>

        {/* Current Week Display */}
        <div className="text-center">
          <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-1">
            Current Week
          </div>
          <div className="text-2xl md:text-4xl font-bold text-primary text-retro">
            {currentWeek}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">
            of {totalWeeks}
          </div>
        </div>

        {/* Next Week Button */}
        <div className="flex-1 flex justify-end">
          {hasNext ? (
            <Link href={`/week/${currentWeek + 1}`}>
              <Button
                variant="outline"
                className="retro-button w-full md:w-auto"
              >
                <span className="hidden sm:inline">Week {currentWeek + 1}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="retro-button w-full md:w-auto opacity-50 cursor-not-allowed"
              disabled
            >
              <span className="hidden sm:inline">No Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Jump Links */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Quick Jump
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => (
            <Link key={weekNum} href={`/week/${weekNum}`}>
              <Button
                variant={weekNum === currentWeek ? 'default' : 'outline'}
                size="sm"
                className={`retro-button min-w-[3rem] ${
                  weekNum === currentWeek
                    ? 'bg-primary text-primary-foreground'
                    : ''
                }`}
              >
                {weekNum}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

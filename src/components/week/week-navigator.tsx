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
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Previous Week Button */}
        <div className="flex-shrink-0">
          {hasPrevious ? (
            <Link href={`/week/${currentWeek - 1}`}>
              <Button
                variant="outline"
                className="retro-button px-2 md:px-4"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Week {currentWeek - 1}</span>
                <span className="md:hidden sr-only">Prev</span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="retro-button px-2 md:px-4 opacity-50 cursor-not-allowed"
              size="sm"
              disabled
            >
              <ChevronLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">No Previous</span>
              <span className="md:hidden sr-only">Prev</span>
            </Button>
          )}
        </div>

        {/* Current Week Display */}
        <div className="text-center flex-1 min-w-0 px-2">
          <div className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-tight md:tracking-wider mb-1">
            Current Week
          </div>
          <div className="text-2xl md:text-4xl font-bold text-primary text-retro">
            {currentWeek}
          </div>
          <div className="text-[10px] md:text-sm text-muted-foreground mt-1">
            of {totalWeeks}
          </div>
        </div>

        {/* Next Week Button */}
        <div className="flex-shrink-0">
          {hasNext ? (
            <Link href={`/week/${currentWeek + 1}`}>
              <Button
                variant="outline"
                className="retro-button px-2 md:px-4"
                size="sm"
              >
                <span className="hidden md:inline">Week {currentWeek + 1}</span>
                <span className="md:hidden sr-only">Next</span>
                <ChevronRight className="h-4 w-4 md:ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="retro-button px-2 md:px-4 opacity-50 cursor-not-allowed"
              size="sm"
              disabled
            >
              <span className="hidden md:inline">No Next</span>
              <span className="md:hidden sr-only">Next</span>
              <ChevronRight className="h-4 w-4 md:ml-2" />
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

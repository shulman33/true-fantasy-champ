'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatsGrid } from './stats-grid';

interface LuckyStat {
  teamId: string;
  teamName: string;
  owner?: string;
  abbrev?: string;
  differential: number;
  actualWins: number;
  trueWins: number;
}

interface ConsistentStat {
  teamId: string;
  teamName: string;
  owner?: string;
  abbrev?: string;
  consistency: number;
}

interface ScoringStats {
  teamId: string;
  teamName: string;
  owner?: string;
  abbrev?: string;
  averagePoints: number;
}

interface CollapsibleStatsGridProps {
  luckiest?: LuckyStat | null;
  unluckiest?: LuckyStat | null;
  mostConsistent?: ConsistentStat | null;
  highestScoring?: ScoringStats | null;
}

const STORAGE_KEY = 'dashboard-stats-collapsed';

export function CollapsibleStatsGrid({
  luckiest,
  unluckiest,
  mostConsistent,
  highestScoring,
}: CollapsibleStatsGridProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === 'false'); // Note: stored value is string 'true' or 'false'
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(STORAGE_KEY, String(open));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 mb-8">
        <h2 className="text-2xl font-bold text-center sm:text-left">Key Insights</h2>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 w-full sm:w-auto">
            {isOpen ? (
              <>
                Hide Insights
                <ChevronUpIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                Show Insights
                <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <StatsGrid
          luckiest={luckiest}
          unluckiest={unluckiest}
          mostConsistent={mostConsistent}
          highestScoring={highestScoring}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

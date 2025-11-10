'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface TeamMetadata {
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
}

export function TeamsNav() {
  const [teams, setTeams] = useState<TeamMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          // Extract team metadata from standings
          const teamData = data.standings.map((team: any) => ({
            teamId: team.teamId,
            teamName: team.teamName,
            owner: team.owner,
            abbrev: team.abbrev,
          }));
          // Sort alphabetically by team name
          teamData.sort((a: TeamMetadata, b: TeamMetadata) =>
            a.teamName.localeCompare(b.teamName)
          );
          setTeams(teamData);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading || teams.length === 0) {
    return (
      <button className="text-sm hover:text-primary transition-colors py-3 cursor-not-allowed opacity-50">
        TEAMS
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm hover:text-primary transition-colors py-3 flex items-center gap-1 outline-none">
        TEAMS
        <ChevronDown className="w-3 h-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 max-h-[400px] overflow-y-auto border-2 border-primary bg-card"
      >
        <DropdownMenuLabel className="font-bold text-primary">
          ALL TEAMS
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-primary/20" />
        {teams.map((team) => (
          <DropdownMenuItem key={team.teamId} asChild>
            <Link
              href={`/team/${team.teamId}`}
              className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 px-2 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{team.teamName}</span>
                <span className="text-xs text-muted-foreground">{team.owner}</span>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

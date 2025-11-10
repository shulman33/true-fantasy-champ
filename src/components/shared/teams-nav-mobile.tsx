'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TeamMetadata {
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
}

interface TeamsNavMobileProps {
  onNavigate?: () => void;
}

export function TeamsNavMobile({ onNavigate }: TeamsNavMobileProps) {
  const [teams, setTeams] = useState<TeamMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
      <div className="text-sm py-3 px-4 border-2 border-primary/20 opacity-50 min-h-11 flex items-center">
        TEAMS
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm hover:text-primary transition-colors py-3 px-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 min-h-11 flex items-center justify-between"
      >
        <span>TEAMS</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 pl-4">
          {teams.map((team) => (
            <Link
              key={team.teamId}
              href={`/team/${team.teamId}`}
              onClick={onNavigate}
              className="text-sm hover:text-primary transition-colors py-2 px-4 border-2 border-primary/10 hover:border-primary hover:bg-primary/10 min-h-11 flex flex-col justify-center"
            >
              <span className="font-semibold">{team.teamName}</span>
              <span className="text-xs text-muted-foreground">{team.owner}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

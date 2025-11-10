import { Badge } from "@/components/ui/badge";

interface ScoreboardHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated?: Date | string;
  seasonYear?: number;
}

export function ScoreboardHeader({
  title,
  subtitle,
  lastUpdated,
  seasonYear = 2025,
}: ScoreboardHeaderProps) {
  return (
    <div className="retro-card p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl text-primary text-retro mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <Badge variant="outline" className="text-xs border-2 border-primary">
            SEASON {seasonYear}
          </Badge>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              Last Update:{" "}
              {typeof lastUpdated === "string"
                ? lastUpdated
                : lastUpdated.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

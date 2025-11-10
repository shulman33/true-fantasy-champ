interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

export function EmptyState({
  title,
  message,
  icon = "📭",
}: EmptyStateProps) {
  return (
    <div className="retro-card p-8 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-4xl">{icon}</div>
        <h2 className="text-xl text-primary text-retro">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

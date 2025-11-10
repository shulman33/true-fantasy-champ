import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "ERROR!",
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="retro-card p-8 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-4xl text-destructive text-retro">⚠</div>
        <h2 className="text-2xl text-destructive text-retro">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="retro-button mt-4"
            variant="default"
          >
            TRY AGAIN
          </Button>
        )}
      </div>
    </div>
  );
}

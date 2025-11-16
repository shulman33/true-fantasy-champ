import { AlertTriangle } from "lucide-react";
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
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
        </div>
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

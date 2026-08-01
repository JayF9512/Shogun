import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard loading spinner block used across pages. */
export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Standard error block with optional retry. */
export function ErrorState({
  message = "Something went wrong.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Standard empty block. */
export function EmptyState({ message = "No results found.", className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Inbox className="h-7 w-7" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

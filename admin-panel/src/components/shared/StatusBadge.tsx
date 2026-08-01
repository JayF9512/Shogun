import { Badge } from "@/components/ui/badge";

/** Maps a domain status string to a coloured badge. */
export function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline"; label: string }> = {
    ACTIVE: { variant: "success", label: "Active" },
    ONLINE: { variant: "success", label: "Online" },
    OFFLINE: { variant: "outline", label: "Offline" },
    BANNED: { variant: "destructive", label: "Banned" },
    OPEN: { variant: "warning", label: "Open" },
    INVESTIGATING: { variant: "warning", label: "Investigating" },
    ACTION_TAKEN: { variant: "success", label: "Action taken" },
    DISMISSED: { variant: "outline", label: "Dismissed" },
    SCHEDULED: { variant: "secondary", label: "Scheduled" },
    ENDED: { variant: "outline", label: "Ended" },
    ENABLED: { variant: "success", label: "On" },
    DISABLED: { variant: "outline", label: "Off" },
    STANDARD: { variant: "secondary", label: "Standard" },
    INDUSTRIAL: { variant: "default", label: "Industrial" },
  };
  const cfg = map[s] ?? { variant: "secondary" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

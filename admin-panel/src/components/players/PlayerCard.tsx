import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PlayerDetail } from "@/types";
import { formatNumber } from "@/lib/utils";

/** Header profile summary for the player detail view. */
export function PlayerCard({ player }: { player: PlayerDetail }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/15 font-serif text-xl font-bold text-primary">
            {player.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold">{player.displayName}</h2>
              <StatusBadge status={player.account?.banned ? "BANNED" : "ACTIVE"} />
              <StatusBadge status={player.tier} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{player.id}</p>
            <p className="text-xs text-muted-foreground">{player.account?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Level</p>
            <p className="text-lg font-bold">{player.level}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Industrial</p>
            <p className="text-lg font-bold">
              {player.industrialLevel > 0 ? `I${player.industrialLevel}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Power</p>
            <p className="text-lg font-bold">{formatNumber(player.power)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

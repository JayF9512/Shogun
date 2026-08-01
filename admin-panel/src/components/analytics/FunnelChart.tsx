"use client";

import { formatNumber } from "@/lib/utils";

/** Simple horizontal funnel visualisation (no external chart needed). */
export function FunnelChart({ data }: { data: { stage: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const conv = i === 0 ? 100 : (d.value / data[0].value) * 100;
        return (
          <div key={d.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{d.stage}</span>
              <span className="text-muted-foreground">
                {formatNumber(d.value)} · {conv.toFixed(1)}%
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-gradient-to-r from-primary to-shogun-ember"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

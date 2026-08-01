"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sun } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getSeasons, setActiveSeason } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function SeasonsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["seasons"], queryFn: getSeasons });
  const [seasonalBuildings, setSeasonalBuildings] = useState(true);
  const [seasonalFeatures, setSeasonalFeatures] = useState(false);

  const activate = useMutation({
    mutationFn: (id: string) => setActiveSeason(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });

  const active = data?.find((s) => s.active);

  return (
    <>
      <PageHeader title="Season Manager" subtitle="Control the 12-season live roadmap and seasonal unlocks." />

      {isLoading ? (
        <LoadingState label="Loading seasons…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="No seasons configured." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-primary/40 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sun className="h-4 w-4 text-primary" /> Current active season
                </CardTitle>
              </CardHeader>
              <CardContent>
                {active ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-serif text-2xl font-bold">
                        S{active.index}. {active.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(active.startsAt)} → {formatDateTime(active.endsAt)}
                      </p>
                      <p className="mt-1 text-sm">
                        Industrial cap: <span className="font-medium">I{active.industrialCap}</span>
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active season.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seasonal features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Seasonal buildings</span>
                  <Switch checked={seasonalBuildings} onCheckedChange={setSeasonalBuildings} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Seasonal features</span>
                  <Switch checked={seasonalFeatures} onCheckedChange={setSeasonalFeatures} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Toggles broadcast to all servers on the active season.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Season timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-border pl-6">
                {data.map((s) => (
                  <li key={s.id} className="relative">
                    <span
                      className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 ${
                        s.active
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      }`}
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          S{s.index}. {s.name}{" "}
                          {s.active && <Badge variant="success" className="ml-1">Active</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(s.startsAt)} → {formatDateTime(s.endsAt)} · Industrial cap I{s.industrialCap}
                        </p>
                      </div>
                      {!s.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activate.mutate(s.id)}
                          disabled={activate.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Set active
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

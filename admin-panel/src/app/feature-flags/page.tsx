"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getFeatureFlags, setFeatureFlag } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { FeatureFlag } from "@/types";

const ENV_TONE: Record<string, string> = {
  PRODUCTION: "border-destructive/40 text-destructive",
  STAGING: "border-amber-500/40 text-amber-400",
  DEVELOPMENT: "border-sky-500/40 text-sky-400",
};

interface FlagRowProps {
  flag: FeatureFlag;
  onSave: (key: string, enabled: boolean, rolloutPct: number) => void;
  saving: boolean;
}

function FlagRow({ flag, onSave, saving }: FlagRowProps) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rollout, setRollout] = useState(flag.rolloutPct);

  // Keep local state in sync if server data changes after a refetch.
  useEffect(() => {
    setEnabled(flag.enabled);
    setRollout(flag.rolloutPct);
  }, [flag.enabled, flag.rolloutPct]);

  const dirty = enabled !== flag.enabled || rollout !== flag.rolloutPct;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{flag.key}</span>
            <Badge variant="outline" className={ENV_TONE[flag.environment] ?? "border-border"}>
              {flag.environment}
            </Badge>
          </div>
          {flag.description && (
            <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
          )}
          {flag.updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground/70">
              Updated {formatDateTime(flag.updatedAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <span className={enabled ? "text-emerald-400" : "text-muted-foreground"}>
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rollout %</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={rollout}
              disabled={!enabled}
              onChange={(e) =>
                setRollout(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
              className="w-20"
            />
          </div>

          <Button
            size="sm"
            disabled={!dirty || saving}
            onClick={() => onSave(flag.key, enabled, enabled ? rollout : 0)}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeatureFlagsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: getFeatureFlags,
  });

  const save = useMutation({
    mutationFn: ({ key, enabled, rolloutPct }: { key: string; enabled: boolean; rolloutPct: number }) =>
      setFeatureFlag(key, enabled, rolloutPct),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature-flags"] }),
  });

  return (
    <>
      <PageHeader
        title="Feature Flags"
        subtitle="Toggle systems and control gradual rollouts per environment. Every change is audited."
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <LoadingState label="Loading feature flags..." />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState message="No feature flags defined yet." />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((flag) => (
            <FlagRow
              key={flag.id}
              flag={flag}
              saving={save.isPending}
              onSave={(key, enabled, rolloutPct) => save.mutate({ key, enabled, rolloutPct })}
            />
          ))}
        </div>
      )}
    </>
  );
}

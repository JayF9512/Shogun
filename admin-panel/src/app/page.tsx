"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Swords,
  ToggleLeft,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuditLogs, getDashboardStats } from "@/lib/api";
import { formatCompact, formatNumber, formatUsdCents, timeAgo } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/players", label: "Players", icon: Users },
  { href: "/economy", label: "Economy", icon: BarChart3 },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/seasons", label: "Seasons", icon: Sun },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/feature-flags", label: "Feature Flags", icon: ToggleLeft },
];

export default function DashboardPage() {
  const stats = useQuery({ queryKey: ["dashboard"], queryFn: getDashboardStats });
  const audit = useQuery({ queryKey: ["audit", "recent"], queryFn: getAuditLogs });

  const health = [
    { name: "API server", status: "operational", value: "126ms p95" },
    { name: "PostgreSQL", status: "operational", value: "12% load" },
    { name: "Redis cache", status: "operational", value: "hit 98.4%" },
    { name: "Game tick worker", status: "operational", value: "on schedule" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="LiveOps overview for Shadows of the Shogun." />

      {stats.isLoading ? (
        <LoadingState label="Loading stats…" />
      ) : stats.isError ? (
        <ErrorState onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total players" value={formatNumber(stats.data!.totalPlayers)} icon={Users} />
          <StatCard label="DAU" value={formatNumber(stats.data!.dau)} icon={Activity} hint="Daily active" />
          <StatCard label="MAU" value={formatNumber(stats.data!.mau)} icon={TrendingUp} hint="Monthly active" />
          <StatCard
            label="Revenue today"
            value={formatUsdCents(stats.data!.revenueToday)}
            icon={DollarSign}
          />
          <StatCard label="Active marches" value={formatCompact(stats.data!.activeMarches)} icon={Swords} />
          <StatCard label="Active battles" value={formatNumber(stats.data!.activeBattles)} icon={Swords} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent admin actions</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.isLoading ? (
              <LoadingState label="Loading feed…" />
            ) : audit.isError ? (
              <ErrorState onRetry={() => audit.refetch()} />
            ) : (
              <ul className="divide-y divide-border">
                {audit.data!.slice(0, 8).map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium text-foreground">{log.adminName ?? log.adminUserId}</span>{" "}
                        <span className="text-muted-foreground">performed</span>{" "}
                        <Badge variant="outline" className="ml-1">{log.action}</Badge>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.targetType} · {log.targetId}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" /> Server health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.map((h) => (
              <div key={h.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-foreground">{h.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{h.value}</span>
              </div>
            ))}
            <p className="pt-2 text-[11px] text-muted-foreground">
              Placeholder indicators (from env / health probe).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center text-sm transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <Icon className="h-5 w-5 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnalytics } from "@/lib/api";

const AXIS = { stroke: "hsl(40 8% 62%)", fontSize: 11 };
const TOOLTIP_STYLE = {
  background: "hsl(240 8% 8%)",
  border: "1px solid hsl(240 6% 18%)",
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  });

  if (isLoading) return <LoadingState label="Loading analytics…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Player funnel, engagement, revenue and economy health." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={data.funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top events by participation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topEvents} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" horizontal={false} />
                <XAxis type="number" {...AXIS} />
                <YAxis type="category" dataKey="name" width={110} {...AXIS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(240 6% 14%)" }} />
                <Bar dataKey="participants" fill="#8B0000" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily active users (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.dau}>
                <defs>
                  <linearGradient id="dau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A227" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" />
                <XAxis dataKey="day" {...AXIS} interval={5} />
                <YAxis {...AXIS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="users" stroke="#C9A227" fill="url(#dau)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (30d, USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" />
                <XAxis dataKey="day" {...AXIS} interval={5} />
                <YAxis {...AXIS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="usd" stroke="#B22222" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Economy health — resource inflation index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {data.inflation.map((r: { resource: string; index: number }) => {
              const hot = r.index >= 1.2;
              const warm = r.index >= 1.1 && r.index < 1.2;
              return (
                <div key={r.resource} className="rounded-lg border border-border p-4 text-center">
                  <p className="text-xs uppercase text-muted-foreground">{r.resource}</p>
                  <p className="text-lg font-bold">{r.index.toFixed(2)}×</p>
                  <Badge variant={hot ? "destructive" : warm ? "warning" : "success"}>
                    {hot ? "Inflating" : warm ? "Watch" : "Stable"}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Index &gt; 1.0 means resource supply is growing faster than sinks (placeholder sample data).
          </p>
        </CardContent>
      </Card>
    </>
  );
}

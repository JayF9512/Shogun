"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Coins,
  Gem,
  Mail,
  ShieldOff,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlayerCard } from "@/components/players/PlayerCard";
import { GrantResourceModal } from "@/components/players/GrantResourceModal";
import { SendMailModal } from "@/components/players/SendMailModal";
import { BanModal } from "@/components/players/BanModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlayer, unbanAccount } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";

export default function PlayerDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["player", id],
    queryFn: () => getPlayer(id),
  });

  const unban = useMutation({
    mutationFn: () => unbanAccount(data?.account?.id ?? ""),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player", id] }),
  });

  if (isLoading) return <LoadingState label="Loading player…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/players">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <PageHeader title="Player Detail" subtitle="Full account inspection and admin actions.">
        <GrantResourceModal
          mode="resource"
          playerId={id}
          settlementId={data.settlement?.id}
          trigger={
            <Button variant="outline" size="sm">
              <Coins className="h-4 w-4" /> Grant Resources
            </Button>
          }
        />
        <GrantResourceModal
          mode="currency"
          playerId={id}
          trigger={
            <Button variant="outline" size="sm">
              <Gem className="h-4 w-4" /> Grant Currency
            </Button>
          }
        />
        <SendMailModal
          playerId={id}
          trigger={
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4" /> Send Mail
            </Button>
          }
        />
        <BanModal
          mode="warn"
          playerId={id}
          accountId={data.account?.id ?? ""}
          trigger={
            <Button variant="outline" size="sm">
              <TriangleAlert className="h-4 w-4" /> Warn
            </Button>
          }
        />
        {data.account?.banned ? (
          <Button variant="secondary" size="sm" onClick={() => unban.mutate()} disabled={unban.isPending}>
            <ShieldOff className="h-4 w-4" /> {unban.isPending ? "Unbanning…" : "Unban"}
          </Button>
        ) : (
          <BanModal
            mode="ban"
            playerId={id}
            accountId={data.account?.id ?? ""}
            trigger={
              <Button variant="destructive" size="sm">
                <Ban className="h-4 w-4" /> Ban
              </Button>
            }
          />
        )}
      </PageHeader>

      <PlayerCard player={data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resource balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Prod/hr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.resources.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.resource}</TableCell>
                    <TableCell>{formatNumber(r.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatNumber(r.capacity)}</TableCell>
                    <TableCell>{formatNumber(r.productionPerHour)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Currencies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency balances</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {data.currencyBalances?.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase text-muted-foreground">{c.currency}</p>
                <p className="text-lg font-bold">{formatNumber(c.amount)}</p>
              </div>
            ))}
            <div className="col-span-2 rounded-lg border border-border p-4 text-sm">
              <p className="text-muted-foreground">
                Settlement: <span className="text-foreground">{data.settlement?.name ?? "—"}</span> · Keep Lv{" "}
                {data.settlement?.tenshuLevel ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Troops */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Troops</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {data.troops.map((t) => (
              <div key={t.troopClass} className="rounded-lg border border-border p-4 text-center">
                <p className="text-xs uppercase text-muted-foreground">
                  {t.troopClass.replace("_", " ")}
                </p>
                <p className="text-lg font-bold">{formatNumber(t.count)}</p>
                <p className="text-xs text-amber-500">{formatNumber(t.wounded)} wounded</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Heroes & pets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heroes &amp; pets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Hero roster</p>
              <ul className="space-y-1.5">
                {data.heroes.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span>
                      {h.name} <span className="text-muted-foreground">· {h.rarity}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Lv {h.level} · {"★".repeat(h.stars)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Pet collection</p>
              <ul className="space-y-1.5">
                {data.pets.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">
                      Lv {p.level} · Evo {p.evolution}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active marches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active marches</CardTitle>
        </CardHeader>
        <CardContent>
          {data.marches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active marches.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>March ID</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Arrives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.marches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.id}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.state} />
                    </TableCell>
                    <TableCell>
                      ({m.targetX}, {m.targetY})
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(m.arrivesAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions (last 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell className={Number(t.delta) < 0 ? "text-destructive" : "text-emerald-500"}>
                    {Number(t.delta) > 0 ? "+" : ""}
                    {formatNumber(t.delta)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

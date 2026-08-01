"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlayerSearch } from "@/components/players/PlayerSearch";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchPlayers } from "@/lib/api";
import { formatNumber, timeAgo } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function PlayersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["players", query],
    queryFn: () => searchPlayers(query),
  });

  const paged = useMemo(() => {
    if (!data) return [];
    return data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  }, [data, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.length / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader title="Players" subtitle="Search and inspect any player account." />

      <PlayerSearch
        onSearch={(q) => {
          setQuery(q);
          setPage(0);
        }}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState label="Searching players…" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !data || data.length === 0 ? (
            <EmptyState message="No players match your search." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Industrial</TableHead>
                    <TableHead>Jade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => {
                    const jade = p.currencyBalances?.find((c) => c.currency === "JADE")?.amount ?? "0";
                    const banned = p.account?.banned;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.displayName}</TableCell>
                        <TableCell>{p.level}</TableCell>
                        <TableCell>{p.industrialLevel > 0 ? `I${p.industrialLevel}` : "—"}</TableCell>
                        <TableCell>{formatNumber(jade)}</TableCell>
                        <TableCell>
                          <StatusBadge status={banned ? "BANNED" : "ACTIVE"} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {timeAgo(p.lastSeenAt ?? p.account?.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/players/${p.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {data.length} result{data.length === 1 ? "" : "s"} · page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

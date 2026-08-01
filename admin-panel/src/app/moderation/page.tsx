"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Ban, CheckCircle2, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getModerationCases, updateModerationCase } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "ACTION_TAKEN", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

export default function ModerationPage() {
  const [filter, setFilter] = useState("ALL");
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["moderation", filter],
    queryFn: () => getModerationCases(filter),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateModerationCase(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moderation"] }),
  });

  return (
    <>
      <PageHeader title="Moderation Queue" subtitle="Review and action reported players.">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState label="Loading cases…" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !data || data.length === 0 ? (
            <EmptyState message="No moderation cases in this view." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/players/${c.playerId}`} className="font-medium text-primary hover:underline">
                        {c.playerName ?? c.playerId}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{c.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{c.reporter}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => update.mutate({ id: c.id, status: "ACTION_TAKEN" })}
                          disabled={update.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Resolve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => update.mutate({ id: c.id, status: "INVESTIGATING" })}
                          disabled={update.isPending}
                        >
                          <ChevronUp className="h-4 w-4 text-amber-500" /> Escalate
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/players/${c.playerId}`}>
                            <Ban className="h-4 w-4 text-destructive" /> Ban
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

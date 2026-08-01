"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditLogs } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { AdminAuditLog } from "@/types";

const PAGE_SIZE = 15;

const ACTION_TONE: Record<string, string> = {
  BAN: "border-destructive/40 text-destructive",
  UNBAN: "border-emerald-500/40 text-emerald-400",
  GRANT_CURRENCY: "border-amber-500/40 text-amber-400",
  GRANT_RESOURCE: "border-amber-500/40 text-amber-400",
  SET_FEATURE_FLAG: "border-sky-500/40 text-sky-400",
  SCHEDULE_EVENT: "border-violet-500/40 text-violet-400",
  SEND_MAIL: "border-slate-500/40 text-slate-300",
};

function formatMetadata(metadata: AdminAuditLog["metadata"]): string {
  if (!metadata) return "—";
  try {
    return Object.entries(metadata)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(", ");
  } catch {
    return "—";
  }
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["audit-log"],
    queryFn: getAuditLogs,
  });

  const actions = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((l) => set.add(l.action));
    return ["ALL", ...Array.from(set).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (action !== "ALL") rows = rows.filter((r) => r.action === action);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.adminName ?? r.adminUserId).toLowerCase().includes(q) ||
          r.targetId.toLowerCase().includes(q) ||
          r.targetType.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, action, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Immutable record of every privileged admin action. Retained for compliance."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search admin / target..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-56"
          />
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === "ALL" ? "All actions" : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState label="Loading audit trail..." />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !pageRows.length ? (
            <EmptyState message="No audit entries match your filters." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{log.adminName ?? log.adminUserId}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ACTION_TONE[log.action] ?? "border-border text-foreground"}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.targetType}</span>{" "}
                        <span className="font-mono text-xs">{log.targetId}</span>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                        {formatMetadata(log.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} · page {safePage + 1} of{" "}
                  {pageCount}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={safePage >= pageCount - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

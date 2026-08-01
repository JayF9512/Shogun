"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { EconomyEditor } from "@/components/economy/EconomyEditor";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEconomyChanges, getEconomyParams } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function EconomyPage() {
  const params = useQuery({ queryKey: ["economy", "params"], queryFn: getEconomyParams });
  const changes = useQuery({ queryKey: ["economy", "changes"], queryFn: getEconomyChanges });

  return (
    <>
      <PageHeader
        title="Economy Live-Tuning"
        subtitle="Adjust production, combat, ascension and march parameters. Changes are audited."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tunable parameters</CardTitle>
        </CardHeader>
        <CardContent>
          {params.isLoading ? (
            <LoadingState label="Loading parameters…" />
          ) : params.isError ? (
            <ErrorState onRetry={() => params.refetch()} />
          ) : (
            <EconomyEditor params={params.data!} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change history</CardTitle>
        </CardHeader>
        <CardContent>
          {changes.isLoading ? (
            <LoadingState label="Loading history…" />
          ) : changes.isError ? (
            <ErrorState onRetry={() => changes.refetch()} />
          ) : changes.data!.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Parameter</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.data!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{c.key}</TableCell>
                    <TableCell className="text-muted-foreground">{c.from}</TableCell>
                    <TableCell className="font-medium">{c.to}</TableCell>
                    <TableCell>{c.adminName}</TableCell>
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

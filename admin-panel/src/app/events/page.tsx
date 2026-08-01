"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EventForm } from "@/components/events/EventForm";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteEvent, getEvents } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { EventDefinition } from "@/types";

function statusFor(e: EventDefinition): string {
  if (e.status) return e.status;
  const now = Date.now();
  if (new Date(e.startsAt).getTime() > now) return "SCHEDULED";
  if (new Date(e.endsAt).getTime() < now) return "ENDED";
  return "ACTIVE";
}

export default function EventsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["events"], queryFn: getEvents });

  const del = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <>
      <PageHeader title="Event Manager" subtitle="Schedule and manage in-game events.">
        <EventForm
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> New Event
            </Button>
          }
        />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState label="Loading events…" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !data || data.length === 0 ? (
            <EmptyState message="No events defined yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.type ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(e.endsAt)}</TableCell>
                    <TableCell>
                      {formatNumber(e.participantCount ?? 0)}
                      {e.maxParticipants ? ` / ${formatNumber(e.maxParticipants)}` : ""}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusFor(e)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => del.mutate(e.id)}
                        disabled={del.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

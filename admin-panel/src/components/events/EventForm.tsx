"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent } from "@/lib/api";
import { toIso } from "@/lib/utils";

const EVENT_TYPES = ["PVP", "PVE", "COLLECTION", "RALLY", "SEASONAL"];

export function EventForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [rewards, setRewards] = useState("{}");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      let parsedRewards: Record<string, unknown> = {};
      try {
        parsedRewards = JSON.parse(rewards || "{}");
      } catch {
        parsedRewards = {};
      }
      return createEvent({
        name,
        key: name.toLowerCase().replace(/\s+/g, "_"),
        type,
        startsAt: toIso(starts),
        endsAt: toIso(ends),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        rewards: parsedRewards,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>Schedule a new in-game event definition.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring Conquest" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max participants</Label>
            <Input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End</Label>
            <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Rewards (JSON)</Label>
            <Textarea
              value={rewards}
              onChange={(e) => setRewards(e.target.value)}
              placeholder='{"tier1":"5000 JADE"}'
            />
          </div>
          {mutation.isError && <p className="text-sm text-destructive sm:col-span-2">Failed to create event.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name || !starts || !ends || mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

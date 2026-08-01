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
import { banAccount, warnPlayer } from "@/lib/api";

type Mode = "ban" | "warn";

export function BanModal({
  mode,
  playerId,
  accountId,
  trigger,
}: {
  mode: Mode;
  playerId: string;
  accountId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      mode === "ban"
        ? banAccount(accountId, reason, duration ? Number(duration) : undefined)
        : warnPlayer(playerId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player", playerId] });
      setOpen(false);
      setReason("");
      setDuration("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "ban" ? "Ban Player" : "Warn Player"}</DialogTitle>
          <DialogDescription>
            {mode === "ban"
              ? "The account will be prevented from logging in. This is audited."
              : "Sends a formal warning to the player. This is audited."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the violation…"
            />
          </div>
          {mode === "ban" && (
            <div className="space-y-2">
              <Label>Duration (days, blank = permanent)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="7"
              />
            </div>
          )}
          {mutation.isError && <p className="text-sm text-destructive">Action failed.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={mode === "ban" ? "destructive" : "default"}
            onClick={() => mutation.mutate()}
            disabled={!reason || mutation.isPending}
          >
            {mutation.isPending ? "Working…" : mode === "ban" ? "Ban Player" : "Warn Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

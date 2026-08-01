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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_TYPES, RESOURCE_TYPES } from "@/types";
import { grantCurrency, grantResource } from "@/lib/api";

type Mode = "resource" | "currency";

export function GrantResourceModal({
  mode,
  playerId,
  settlementId,
  trigger,
}: {
  mode: Mode;
  playerId: string;
  settlementId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(mode === "resource" ? RESOURCE_TYPES[0] : CURRENCY_TYPES[0]);
  const [amount, setAmount] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (mode === "resource") {
        return grantResource(settlementId || playerId, type, value);
      }
      return grantCurrency(playerId, type, value);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player", playerId] });
      setOpen(false);
      setAmount("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "resource" ? "Grant Resources" : "Grant Currency"}
          </DialogTitle>
          <DialogDescription>
            This action is audited to AdminAuditLog and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{mode === "resource" ? "Resource type" : "Currency type"}</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(mode === "resource" ? RESOURCE_TYPES : CURRENCY_TYPES).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
            />
          </div>
          {mutation.isError && (
            <p className="text-sm text-destructive">Grant failed. Please try again.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!amount || Number(amount) <= 0 || mutation.isPending}
          >
            {mutation.isPending ? "Granting…" : "Grant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

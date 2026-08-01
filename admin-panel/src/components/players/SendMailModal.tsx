"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { sendMail } from "@/lib/api";

export function SendMailModal({
  playerId,
  trigger,
}: {
  playerId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reward, setReward] = useState("");

  const mutation = useMutation({
    mutationFn: () => sendMail(playerId, subject, body, reward || undefined),
    onSuccess: () => {
      setOpen(false);
      setSubject("");
      setBody("");
      setReward("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Mail</DialogTitle>
          <DialogDescription>Send an in-game system mail with an optional reward.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Compensation" />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dear Daimyo…" />
          </div>
          <div className="space-y-2">
            <Label>Reward attachment (optional)</Label>
            <Input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder='e.g. {"JADE":500}'
            />
          </div>
          {mutation.isError && <p className="text-sm text-destructive">Failed to send mail.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!subject || !body || mutation.isPending}>
            {mutation.isPending ? "Sending…" : "Send Mail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

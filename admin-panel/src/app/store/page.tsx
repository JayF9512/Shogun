"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ban } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createRewardCode,
  deactivateRewardCode,
  getCampaigns,
  getOffers,
  getProducts,
  getRewardCodes,
} from "@/lib/api";
import { formatDateTime, formatNumber, formatUsdCents } from "@/lib/utils";

function CreateRewardCode() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [jade, setJade] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      createRewardCode({
        code,
        contents: { JADE: Number(jade) || 0 },
        maxRedemptions: Number(maxRedemptions) || 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reward-codes"] });
      setOpen(false);
      setCode("");
      setJade("");
      setMaxRedemptions("");
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Reward Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SHOGUN2026" />
          </div>
          <div className="space-y-2">
            <Label>Jade reward</Label>
            <Input type="number" value={jade} onChange={(e) => setJade(e.target.value)} placeholder="500" />
          </div>
          <div className="space-y-2">
            <Label>Max redemptions</Label>
            <Input
              type="number"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="10000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!code || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StorePage() {
  const products = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const offers = useQuery({ queryKey: ["offers"], queryFn: getOffers });
  const codes = useQuery({ queryKey: ["reward-codes"], queryFn: getRewardCodes });
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: getCampaigns });
  const qc = useQueryClient();

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateRewardCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reward-codes"] }),
  });

  return (
    <>
      <PageHeader title="Store & Rewards" subtitle="Catalog products, offers, reward codes and discounts." />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="codes">Reward Codes</TabsTrigger>
          <TabsTrigger value="campaigns">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-0">
              {products.isLoading ? (
                <LoadingState />
              ) : products.isError ? (
                <ErrorState onRetry={() => products.refetch()} />
              ) : products.data!.length === 0 ? (
                <EmptyState message="No catalog products." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Jade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.data!.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{formatUsdCents(p.priceUsdCents)}</TableCell>
                        <TableCell>{formatNumber(p.jadeGranted)}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.active ? "ENABLED" : "DISABLED"} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardContent className="p-0">
              {offers.isLoading ? (
                <LoadingState />
              ) : offers.isError ? (
                <ErrorState onRetry={() => offers.refetch()} />
              ) : offers.data!.length === 0 ? (
                <EmptyState message="No active offers." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.data!.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.productName ?? o.productId}</TableCell>
                        <TableCell>{o.percentOff ? `${o.percentOff}% off` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.startsAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(o.endsAt)}</TableCell>
                        <TableCell>
                          <StatusBadge status={o.active ? "ACTIVE" : "ENDED"} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <div className="mb-3 flex justify-end">
            <CreateRewardCode />
          </div>
          <Card>
            <CardContent className="p-0">
              {codes.isLoading ? (
                <LoadingState />
              ) : codes.isError ? (
                <ErrorState onRetry={() => codes.refetch()} />
              ) : codes.data!.length === 0 ? (
                <EmptyState message="No reward codes." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Contents</TableHead>
                      <TableHead>Redemptions</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.data!.map((c) => {
                      const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono">{c.code}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {JSON.stringify(c.contents)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(c.redemptions)} / {formatNumber(c.maxRedemptions)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.expiresAt ? formatDateTime(c.expiresAt) : "Never"}
                            {expired && <Badge variant="outline" className="ml-2">Expired</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deactivate.mutate(c.id)}
                              disabled={deactivate.isPending}
                            >
                              <Ban className="h-4 w-4 text-destructive" /> Deactivate
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardContent className="p-0">
              {campaigns.isLoading ? (
                <LoadingState />
              ) : campaigns.isError ? (
                <ErrorState onRetry={() => campaigns.refetch()} />
              ) : campaigns.data!.length === 0 ? (
                <EmptyState message="No discount campaigns." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.data!.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.percentOff}% off</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.startsAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.endsAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

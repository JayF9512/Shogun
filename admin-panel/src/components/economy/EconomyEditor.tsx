"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { saveEconomyParams } from "@/lib/api";
import type { EconomyParam } from "@/types";

/** Editable table of economy parameters grouped by category. */
export function EconomyEditor({ params }: { params: EconomyParam[] }) {
  const [rows, setRows] = useState<EconomyParam[]>(params);
  const [saved, setSaved] = useState(false);

  useEffect(() => setRows(params), [params]);

  const dirty = JSON.stringify(rows) !== JSON.stringify(params);

  const mutation = useMutation({
    mutationFn: () => saveEconomyParams(rows),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const categories = Array.from(new Set(rows.map((r) => r.category)));

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-semibold">{cat}</h3>
            <Badge variant="outline">{rows.filter((r) => r.category === cat).length}</Badge>
          </div>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead className="w-40">Value</TableHead>
                  <TableHead className="w-24">Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((r) => r.category === cat)
                  .map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={r.value}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((p) =>
                                p.key === r.key ? { ...p, value: Number(e.target.value) } : p,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending}>
          <Save className="h-4 w-4" />
          {mutation.isPending ? "Publishing…" : "Save & Publish"}
        </Button>
        {saved && <span className="text-sm text-emerald-500">Changes published.</span>}
        {dirty && !saved && <span className="text-sm text-amber-500">Unsaved changes</span>}
      </div>
    </div>
  );
}

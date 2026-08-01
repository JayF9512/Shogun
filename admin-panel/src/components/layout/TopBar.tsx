"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearToken } from "@/lib/auth";

export function TopBar() {
  const router = useRouter();
  const envTier = process.env.NEXT_PUBLIC_ENV_TIER || "development";

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-shogun-sumi px-4 md:px-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary md:hidden" />
        <span className="font-serif text-sm font-semibold text-foreground md:hidden">
          Shogun LiveOps
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={envTier === "production" ? "destructive" : "warning"} className="uppercase">
          {envTier}
        </Badge>
        <div className="hidden text-right text-xs leading-tight sm:block">
          <p className="font-medium text-foreground">Ops Admin</p>
          <p className="text-muted-foreground">dev-admin</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

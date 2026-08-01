"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Home,
  ShieldCheck,
  ShoppingBag,
  Sun,
  ToggleLeft,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/players", label: "Players", icon: Users },
  { href: "/economy", label: "Economy", icon: BarChart3 },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/seasons", label: "Seasons", icon: Sun },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/feature-flags", label: "Feature Flags", icon: ToggleLeft },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-shogun-sumi md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-serif text-lg font-bold text-primary-foreground">
          将
        </div>
        <div className="leading-tight">
          <p className="font-serif text-sm font-bold text-foreground">Shadows of the Shogun</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">LiveOps</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-[11px] text-muted-foreground">
        <p>Phase 2 · Admin Panel</p>
        <p className="mt-0.5">All actions are audited.</p>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Goal,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Vault,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BankAvatar } from "@/components/bank-avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: CircleDollarSign },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function VaultIQShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10 text-secondary shadow-glow-info">
              <Vault className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tightest">VaultIQ</div>
              <div className="text-xs text-muted">Every peso. Every account. One view.</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md border-l-2 px-4 py-3 text-sm transition",
                    active
                      ? "border-primary bg-accent-muted text-primary"
                      : "border-transparent text-muted hover:bg-accent-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-surface-raised p-4">
              <BankAvatar name="James Damaso" initials="JD" tone="primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">James Damaso</p>
                <p className="text-xs text-muted">Treasury Lead</p>
              </div>
              <Badge variant="success">Pro</Badge>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="dashboard-grid flex-1 pb-24 lg:pb-0">{children}</main>
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
            <div className="grid grid-cols-5">
              {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-3 text-2xs",
                      active ? "text-primary" : "text-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

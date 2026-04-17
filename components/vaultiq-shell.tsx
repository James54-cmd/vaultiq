"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Goal,
  LayoutDashboard,
  PiggyBank,
  Settings,
  LogOut,
} from "lucide-react";

import vaultLogoWithText from "@/app/public/assets/logo/vault-logo-with-text.png";
import { Badge } from "@/components/ui/badge";
import { BankAvatar } from "@/components/bank-avatar";
import { Button } from "@/components/ui/button";
import { signOutRequest } from "@/features/auth/services/auth-api.service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const [userName, setUserName] = useState("VaultIQ User");
  const [userInitials, setUserInitials] = useState("VQ");
  const [userEmail, setUserEmail] = useState("Secure workspace");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const hydrateUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        return;
      }

      const fullName =
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
          ? user.user_metadata.full_name
          : user.email.split("@")[0];

      const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

      setUserName(fullName);
      setUserInitials(initials || "VQ");
      setUserEmail(user.email);
    };

    hydrateUser();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-background lg:flex lg:flex-col">
          <div className="px-6 py-8">
            <Link href="/" className="block w-fit">
              <Image
                src={vaultLogoWithText}
                alt="VaultIQ"
                priority
                className="h-auto w-36"
              />
            </Link>
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
            <div className="space-y-3 rounded-lg bg-surface-raised p-4">
              <div className="flex items-center gap-3">
                <BankAvatar name={userName} initials={userInitials} tone="primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted">{userEmail}</p>
                </div>
                <Badge variant="success">Pro</Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await signOutRequest();
                    router.push("/login");
                    router.refresh();
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col lg:pl-60">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="block">
                <Image
                  src={vaultLogoWithText}
                  alt="VaultIQ"
                  priority
                  className="h-auto w-28"
                />
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="success">Pro</Badge>
                <BankAvatar name={userName} initials={userInitials} tone="primary" className="h-8 w-8" />
              </div>
            </div>
          </header>
          <main className="dashboard-grid min-h-screen flex-1 pb-24 lg:pb-0">{children}</main>
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

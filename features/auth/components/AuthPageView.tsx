import Image from "next/image";
import Link from "next/link";

import vaultLogoWithText from "@/app/public/assets/logo/vault-logo-with-text.png";
import { AuthForm } from "@/features/auth/components/AuthForm";

type AuthPageViewProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthPageView({ mode }: AuthPageViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden rounded-3xl border border-border bg-surface p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <Link href="/" className="block w-fit">
              <Image
                src={vaultLogoWithText}
                alt="VaultIQ"
                priority
                className="h-auto w-40"
              />
            </Link>
            <div className="space-y-4">
              <p className="text-3xl font-bold tracking-tightest text-foreground">
                Every peso. Every account. One view.
              </p>
              <p className="max-w-md text-sm text-muted">
                Multi-bank visibility with a secure, finance-first workspace designed for structured growth.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-5">
            <p className="text-sm font-medium text-foreground">
              {mode === "sign-in"
                ? "Sign in to continue building your financial command center."
                : "Create your account first, then we can layer Gmail sync on the correct user identity."}
            </p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md items-center">
          <AuthForm mode={mode} />
        </div>
      </div>
    </div>
  );
}

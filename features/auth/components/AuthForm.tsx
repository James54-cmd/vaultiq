"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import type { SignInInput, SignUpInput } from "@/features/auth/types/Auth";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const oauthError = searchParams.get("error");
  const [values, setValues] = useState<SignInInput & Partial<SignUpInput>>({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  });
  const {
    submit,
    signInWithGoogle,
    isPending,
    fieldErrors,
    formError,
    successMessage,
  } = useAuthForm(mode);

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-medium sm:p-8">
      <div className="space-y-2">
        <p className="text-2xs font-medium uppercase tracking-widest text-secondary">
          VaultIQ Access
        </p>
        <h1 className="text-2xl font-bold tracking-tightest text-foreground">
          {mode === "sign-in" ? "Sign in to VaultIQ" : "Create your VaultIQ account"}
        </h1>
        <p className="text-sm text-muted">
          {mode === "sign-in"
            ? "Secure access for your finance workspace."
            : "Start with email and password. Gmail connect comes after account access is in place."}
        </p>
      </div>

      {registered ? (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          Account created. If your project requires email confirmation, check your inbox before signing in.
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {successMessage}
        </div>
      ) : null}

      {oauthError ? (
        <div className="mt-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          Google sign-in could not be completed. Please try again.
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full border-border bg-surface text-foreground hover:bg-accent-muted hover:text-foreground"
          disabled={isPending}
          onClick={async () => {
            await signInWithGoogle();
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
          >
            <path
              fill="#F0F4F8"
              d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.39a4.64 4.64 0 0 1-2 3.05v2.53h3.24c1.9-1.75 2.97-4.33 2.97-7.38Z"
            />
            <path
              fill="#38BDF8"
              d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.53c-.9.6-2.05.95-3.37.95-2.59 0-4.79-1.75-5.57-4.1H3.08v2.61A9.98 9.98 0 0 0 12 22Z"
            />
            <path
              fill="#FBBF24"
              d="M6.43 13.88A6.02 6.02 0 0 1 6.12 12c0-.65.11-1.27.31-1.88V7.51H3.08A9.98 9.98 0 0 0 2 12c0 1.61.38 3.13 1.08 4.49l3.35-2.61Z"
            />
            <path
              fill="#4ADE80"
              d="M12 6.02c1.47 0 2.78.5 3.81 1.47l2.86-2.86C16.95 3 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.51l3.35 2.61c.78-2.35 2.98-4.1 5.57-4.1Z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      <div className="relative mt-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t after:border-border">
        <span className="relative z-10 bg-surface-raised px-3 text-muted">Or continue with email</span>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await submit(values as SignInInput & SignUpInput);
        }}
      >
        {mode === "sign-up" ? (
          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-foreground">Full Name</Label>
            <Input
              id="full-name"
              value={values.fullName ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              placeholder="Juan Dela Cruz"
              className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
            />
            <FieldError message={fieldErrors.fullName?.[0]} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="you@example.com"
            className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
          />
          <FieldError message={fieldErrors.email?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">Password</Label>
          <Input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="At least 8 characters"
            className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
          />
          <FieldError message={fieldErrors.password?.[0]} />
        </div>

        {mode === "sign-up" ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={values.confirmPassword ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              placeholder="Repeat your password"
              className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
            />
            <FieldError message={fieldErrors.confirmPassword?.[0]} />
          </div>
        ) : null}

        {formError ? <FieldError message={formError} /> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? mode === "sign-in"
              ? "Signing In..."
              : "Creating Account..."
            : mode === "sign-in"
              ? "Sign In"
              : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
        <Link
          href={mode === "sign-in" ? "/signup" : "/login"}
          className="font-medium text-secondary underline-offset-4 hover:underline"
        >
          {mode === "sign-in" ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}

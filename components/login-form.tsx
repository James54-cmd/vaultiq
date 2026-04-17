"use client"

import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"
import { useAuthForm } from "@/features/auth/hooks/useAuthForm"
import type { SignInInput, SignUpInput } from "@/features/auth/types/Auth"

export function LoginForm({
  mode = "sign-in",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  mode?: "sign-in" | "sign-up"
}) {
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered") === "1"
  const oauthError = searchParams.get("error")
  const [values, setValues] = useState<SignInInput & Partial<SignUpInput>>({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  })
  const { submit, signInWithGoogle, isPending, fieldErrors, formError } = useAuthForm(mode)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {registered ? (
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          Account created. If email confirmation is enabled, check your inbox before signing in.
        </div>
      ) : null}

      {oauthError ? (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          Google sign-in could not be completed. Please try again.
        </div>
      ) : null}

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          await submit(values)
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10">
                <Image
                  src="/assets/logo/vault-logo-icon.png"
                  alt="VaultIQ Logo"
                  width={34}
                  height={34}
                  className="h-8 w-8"
                />
              </div>
              <span className="sr-only">VaultIQ</span>
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              {mode === "sign-in" ? "Welcome to VaultIQ" : "Create your VaultIQ account"}
            </h1>
            <div className="text-center text-sm text-muted">
              {mode === "sign-in" ? "Don&apos;t have an account?" : "Already have an account?"}{" "}
              <Link
                href={mode === "sign-in" ? "/signup" : "/login"}
                className="underline underline-offset-4 text-foreground"
              >
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {mode === "sign-up" ? (
              <div className="grid gap-2">
                <Label htmlFor="full-name" className="text-foreground">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="Juan Dela Cruz"
                  required
                  value={values.fullName ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
                />
                <FieldError message={fieldErrors.fullName?.[0]} />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
              />
              <FieldError message={fieldErrors.email?.[0]} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                required
                value={values.password}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="border-border bg-surface text-foreground placeholder:text-muted focus-visible:ring-secondary"
              />
              <FieldError message={fieldErrors.password?.[0]} />
            </div>

            {mode === "sign-up" ? (
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat your password"
                  required
                  value={values.confirmPassword ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
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
                  ? "Login"
                  : "Create Account"}
            </Button>
          </div>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-surface-raised px-2 text-muted">
              Or
            </span>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              className="w-full border-border bg-surface text-foreground hover:bg-accent-muted hover:text-foreground"
              type="button"
              disabled={isPending}
              onClick={async () => {
                await signInWithGoogle()
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.2l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.4-.2-2H12Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.4 0 4.5-.8 6-2.3l-3.1-2.4c-.9.6-1.9.9-2.9.9-2.2 0-4.1-1.5-4.8-3.5l-3.2 2.5C5.5 20 8.5 22 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M7.2 14.7c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.2-2.5C3.4 9.7 3 11.1 3 12.8s.4 3.1 1 4.4l3.2-2.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M12 7.4c1.3 0 2.5.5 3.5 1.4l2.6-2.6C16.5 4.7 14.4 4 12 4 8.5 4 5.5 6 4 9.1l3.2 2.5c.7-2.1 2.6-3.6 4.8-3.6Z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </form>

      <div className="text-balance text-center text-xs text-muted [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-foreground">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}

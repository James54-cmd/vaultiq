"use client"

import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"
import { useAuthForm } from "@/features/auth/hooks/useAuthForm"
import type { SignInInput } from "@/features/auth/types/Auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered") === "1"
  const oauthError = searchParams.get("error")
  const [values, setValues] = useState<SignInInput>({
    email: "",
    password: "",
  })
  const { submit, signInWithGoogle, isPending, fieldErrors, formError } = useAuthForm("sign-in")

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
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-primary">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">VaultIQ</span>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Welcome to VaultIQ</h1>
            <div className="text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 text-foreground">
                Sign up
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
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

            {formError ? <FieldError message={formError} /> : null}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing In..." : "Login"}
            </Button>
          </div>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-surface-raised px-2 text-muted">
              Or
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="w-full border-border bg-surface text-foreground hover:bg-accent-muted hover:text-foreground" type="button" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Apple Soon
            </Button>
            <Button
              variant="outline"
              className="w-full border-border bg-surface text-foreground hover:bg-accent-muted hover:text-foreground"
              type="button"
              disabled={isPending}
              onClick={async () => {
                await signInWithGoogle()
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 12.48 5.867 .307 5.387.307 12 5.56 12 12.173c3.573 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
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

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-2xs font-medium uppercase tracking-widest text-secondary">404</p>
        <h1 className="text-3xl font-bold tracking-tightest text-foreground">Page not found</h1>
        <p className="text-sm text-muted">
          The page you were looking for is unavailable or may have moved.
        </p>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

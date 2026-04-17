import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-2xs font-medium uppercase tracking-widest text-secondary">404</p>
        <h1 className="text-3xl font-bold tracking-tightest text-foreground">Page not found</h1>
        <p className="text-sm text-muted">
          The page you were looking for is unavailable or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition hover:brightness-110"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

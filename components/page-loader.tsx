import Image from "next/image";

export function PageLoader() {
  return (
    <div className="page-loader relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div className="page-loader__glow page-loader__glow--primary" aria-hidden="true" />
      <div className="page-loader__glow page-loader__glow--secondary" aria-hidden="true" />

      <div className="page-loader__content relative z-10 flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="page-loader__logo-wrap">
          <Image
            src="/assets/logo/vault-logo-with-text.png"
            alt="VaultIQ"
            priority
            width={985}
            height={289}
            className="page-loader__logo h-auto w-full"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary/80">
            Securely Loading
          </p>
          <p className="text-sm text-muted">
            Pulling together your accounts, budgets, and recent activity.
          </p>
        </div>

        <div className="page-loader__meter" aria-hidden="true">
          <div className="page-loader__meter-bar" />
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-2xs font-medium uppercase tracking-widest text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tightest text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

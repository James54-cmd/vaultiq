"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const dialogShellContentClassName =
  "max-w-xl rounded-[22px] border border-border/80 bg-surface p-0 text-foreground shadow-[0_24px_64px_rgba(11,18,32,0.18)]";

type DialogShellHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

type DialogShellMetaItem = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  className?: string;
};

type DialogShellMetaListProps = {
  items: DialogShellMetaItem[];
  className?: string;
};

type DialogShellSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function DialogShellHeaderFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-border/60 bg-background/95 px-4 py-3.5 sm:px-5 sm:py-4",
        className
      )}
      {...props}
    />
  );
}

export function DialogShellHeading({
  eyebrow,
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: DialogShellHeadingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-1">
        <div className={titleClassName}>{title}</div>
        {description ? <div className={descriptionClassName}>{description}</div> : null}
      </div>
    </div>
  );
}

export function DialogShellMetaList({ items, className }: DialogShellMetaListProps) {
  const visibleItems = items.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== ""
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <dl
      className={cn(
        "mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border/60 pt-3 sm:gap-x-4",
        className
      )}
    >
      {visibleItems.map((item) => (
        <div key={item.label} className={cn("min-w-0", item.className)}>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {item.label}
          </dt>
          <dd className={cn("mt-1 break-words text-sm font-medium leading-5 text-foreground", item.valueClassName)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const DialogShellBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function DialogShellBody({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5",
        className
      )}
      {...props}
    />
  );
});

export function DialogShellSection({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
}: DialogShellSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-border/70 bg-background/55 p-3.5 shadow-sm shadow-slate-950/5 sm:p-4",
        className
      )}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? <p className="text-xs leading-5 text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function DialogShellFooterBar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-auto shrink-0 border-t border-border/70 bg-surface/96 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/84 sm:px-5 sm:py-3.5",
        className
      )}
      {...props}
    />
  );
}

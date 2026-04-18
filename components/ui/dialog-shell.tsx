"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const dialogShellContentClassName =
  "max-w-2xl rounded-[24px] border border-border/80 bg-surface p-0 text-foreground shadow-[0_24px_64px_rgba(11,18,32,0.22)]";

type DialogShellHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
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
        "shrink-0 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/80 to-background/45 px-4 py-4 sm:px-5 sm:py-5",
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
    <div className={cn("space-y-1.5", className)}>
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

export const DialogShellBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function DialogShellBody({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5", className)}
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
        "rounded-[20px] border border-border/70 bg-background/60 p-4 shadow-sm shadow-slate-950/5 sm:p-5",
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        "sticky bottom-0 z-10 mt-auto shrink-0 border-t border-border/70 bg-surface/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-surface/82 sm:px-5",
        className
      )}
      {...props}
    />
  );
}

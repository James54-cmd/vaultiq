import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 rounded-sm border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-secondary focus:ring-4 focus:ring-secondary/10",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

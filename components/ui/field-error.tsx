import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type FieldErrorProps = {
  message?: string | null;
  className?: string;
};

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn("flex items-center gap-2 text-xs text-error", className)}>
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </p>
  );
}

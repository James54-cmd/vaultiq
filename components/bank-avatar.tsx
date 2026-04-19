import Image from "next/image";

import { SUPPORTED_INSTITUTIONS } from "@/features/accounts/constants/institutions";
import { cn } from "@/lib/utils";

type BankAvatarProps = {
  name: string;
  initials: string;
  imageSrc?: string | null;
  tone?: "primary" | "secondary" | "warning" | "error";
  className?: string;
};

const toneClasses = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  secondary: "border-secondary/20 bg-secondary/10 text-secondary",
  warning: "border-warning/20 bg-warning/10 text-warning",
  error: "border-error/20 bg-error/10 text-error",
};

export function BankAvatar({
  name,
  initials,
  imageSrc,
  tone = "secondary",
  className,
}: BankAvatarProps) {
  const institution = SUPPORTED_INSTITUTIONS.find((inst) => inst.name.toLowerCase() === name.toLowerCase());
  const finalImageSrc = imageSrc || institution?.logo;
  const fallbackGradient = institution?.gradient;

  if (finalImageSrc) {
    return (
      <div
        aria-label={name}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold shadow-subtle",
          className
        )}
      >
        <Image
          src={finalImageSrc}
          alt={name}
          width={40}
          height={40}
          className="h-full w-full rounded-full object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold shadow-subtle",
        fallbackGradient ? `bg-gradient-to-br text-white border-transparent ${fallbackGradient}` : toneClasses[tone],
        className
      )}
    >
      {initials}
    </div>
  );
}

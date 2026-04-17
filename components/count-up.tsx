"use client";

import { useEffect, useMemo, useState } from "react";

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 900;
    const started = performance.now();

    const update = (timestamp: number) => {
      const progress = Math.min((timestamp - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(update);
      }
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const formatted = useMemo(
    () =>
      `${prefix}${display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`,
    [decimals, display, prefix, suffix]
  );

  return <span className={className}>{formatted}</span>;
}

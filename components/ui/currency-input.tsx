import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  currencySymbol?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currencySymbol = "₱", ...props }, ref) => {
    return (
      <div className="relative">
        {currencySymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currencySymbol}
          </span>
        )}
        <Input
          type="number"
          min="0"
          step="0.01"
          className={cn(
            currencySymbol && "pl-8",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
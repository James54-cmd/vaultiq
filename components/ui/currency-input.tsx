import * as React from "react"
import { cn } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency-icons"
import { Input } from "./input"

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  currencyCode?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currencyCode = "PHP", onFocus, ...props }, ref) => {
    const currencySymbol = getCurrencySymbol(currencyCode)

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      event.target.select()
      onFocus?.(event)
    }

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-[13px] text-muted-foreground">
          <span className="text-sm font-semibold">{currencySymbol}</span>
        </div>
        <Input
          type="number"
          min="0"
          step="0.01"
          className={cn("pl-6", className)}
          onFocus={handleFocus}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
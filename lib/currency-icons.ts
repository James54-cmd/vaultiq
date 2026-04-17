import { CURRENCY_CODES } from "@/features/budgets/constants/currency.constants"

export function getCurrencySymbol(currencyCode?: string) {
  const currency = CURRENCY_CODES.find(c => c.code === currencyCode)
  return currency?.symbol || "₱" // Default to PHP symbol
}
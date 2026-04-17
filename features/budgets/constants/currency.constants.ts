export const CURRENCY_CODES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BTC", name: "Bitcoin", symbol: "₿" },
  { code: "ETH", name: "Ethereum", symbol: "Ξ" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "₣" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "MXN", name: "Mexican Peso", symbol: "₱" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
] as const

export const currencyOptions = CURRENCY_CODES.map(currency => ({
  value: currency.code,
  label: `${currency.code} - ${currency.name}`,
  symbol: currency.symbol
}))

export type CurrencyCode = typeof CURRENCY_CODES[number]['code']
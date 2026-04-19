const phpBaseExchangeRates: Record<string, number> = {
  PHP: 1,
  USD: 56,
};

export const supportedCurrencyCodes = ["PHP", "USD"] as const;

export function getExchangeRate(currencyCode: string) {
  const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
  const rate = phpBaseExchangeRates[normalizedCurrencyCode];

  if (!rate) {
    throw new Error(`Unsupported currency code: ${normalizedCurrencyCode}`);
  }

  return rate;
}

export function convertCurrency(amount: number, fromCurrencyCode: string, toCurrencyCode: string) {
  const normalizedFromCurrencyCode = fromCurrencyCode.trim().toUpperCase();
  const normalizedToCurrencyCode = toCurrencyCode.trim().toUpperCase();

  if (normalizedFromCurrencyCode === normalizedToCurrencyCode) {
    return Number(amount.toFixed(2));
  }

  const amountInPhp = amount * getExchangeRate(normalizedFromCurrencyCode);
  return Number((amountInPhp / getExchangeRate(normalizedToCurrencyCode)).toFixed(2));
}

/**
 * Currency conversion utilities for the client
 */

export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
};

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  compact = false
): string {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      notation: compact ? 'compact' : 'standard',
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Parse currency input (remove symbols, handle spaces)
 */
export function parseCurrencyInput(value: string): number {
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Fetch exchange rates
 */
export async function fetchExchangeRates(
  base: Currency,
  symbols: Currency[]
): Promise<{
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  provider: string;
  cacheStatus: 'HIT' | 'MISS';
}> {
  const symbolsParam = symbols.join(',');
  const response = await fetch(`/api/exchange-rates?base=${base}&symbols=${symbolsParam}`);

  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }

  return response.json();
}

/**
 * Convert currency
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<{
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
  timestamp: number;
  provider: string;
}> {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, from, to }),
  });

  if (!response.ok) {
    throw new Error('Conversion failed');
  }

  return response.json();
}

/**
 * Get time since update
 */
export function getTimeSinceUpdate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

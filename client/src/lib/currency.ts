import { Currency } from '@/lib/store';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
};

// Exchange rates relative to USD (mock rates)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
};

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency = 'USD',
  toCurrency: Currency = 'USD'
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];
  
  return convertedAmount;
};

export const formatCurrency = (
  amount: number,
  currency: Currency = 'USD',
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string => {
  const { showSymbol = true, decimals = 2 } = options || {};
  
  const formatted = amount.toFixed(decimals);
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (!showSymbol) return formatted;
  
  return `${symbol}${formatted}`;
};

export const displayAmount = (
  amount: number,
  currency: Currency = 'USD',
  showSymbol: boolean = true
): string => {
  return formatCurrency(amount, currency, { showSymbol, decimals: 2 });
};

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency];
};

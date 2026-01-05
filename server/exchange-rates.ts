/**
 * Exchange Rate Cache & API Management
 * Fetches rates from exchangerate.host and caches them for 1 hour
 */

interface CachedRate {
  rates: Record<string, number>;
  timestamp: number;
  provider: string;
  base: string;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const PROVIDER_URL = process.env.EXCHANGE_RATE_PROVIDER_URL || 'https://api.exchangerate.host';

// In-memory cache
const cache: Map<string, CachedRate> = new Map();

/**
 * Fetch exchange rates from provider
 * Returns cached rates if available and not expired
 */
export async function getExchangeRates(
  base: string,
  symbols: string[]
): Promise<{
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  provider: string;
  cacheStatus: 'HIT' | 'MISS';
}> {
  const cacheKey = `${base}:${symbols.sort().join(',')}`;
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return {
      base: cached.base,
      rates: cached.rates,
      timestamp: cached.timestamp,
      provider: cached.provider,
      cacheStatus: 'HIT',
    };
  }

  // Fetch from provider
  try {
    const symbolsParam = symbols.join(',');
    const url = `${PROVIDER_URL}/latest?base=${base}&symbols=${symbolsParam}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinanceBuddy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Provider returned ${response.status}`);
    }

    const data: any = await response.json();

    if (!data.rates) {
      throw new Error('Invalid response format from provider');
    }

    // Cache the result
    const cachedData: CachedRate = {
      rates: data.rates,
      timestamp: now,
      provider: 'exchangerate.host',
      base,
    };

    cache.set(cacheKey, cachedData);

    return {
      base,
      rates: data.rates,
      timestamp: now,
      provider: 'exchangerate.host',
      cacheStatus: 'MISS',
    };
  } catch (error) {
    console.error('Exchange rate fetch error:', error);

    // Return cached data even if expired on failure
    if (cached) {
      return {
        base: cached.base,
        rates: cached.rates,
        timestamp: cached.timestamp,
        provider: `${cached.provider} (stale)`,
        cacheStatus: 'HIT',
      };
    }

    // No cache available - throw error
    throw error;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
  timestamp: number;
  provider: string;
}> {
  if (fromCurrency === toCurrency) {
    return {
      from: fromCurrency,
      to: toCurrency,
      amount,
      converted: amount,
      rate: 1,
      timestamp: Date.now(),
      provider: 'exchangerate.host',
    };
  }

  const rates = await getExchangeRates(fromCurrency, [toCurrency]);
  const rate = rates.rates[toCurrency];

  if (!rate) {
    throw new Error(`No rate found for ${fromCurrency} to ${toCurrency}`);
  }

  // Use decimal-safe calculation (cents)
  const converted = Math.round((amount * rate * 100)) / 100;

  return {
    from: fromCurrency,
    to: toCurrency,
    amount,
    converted,
    rate: Math.round(rate * 10000) / 10000,
    timestamp: Date.now(),
    provider: 'exchangerate.host',
  };
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  oldestEntry: number | null;
} {
  let oldestEntry: number | null = null;

  cache.forEach((value) => {
    if (!oldestEntry || value.timestamp < oldestEntry) {
      oldestEntry = value.timestamp;
    }
  });

  return {
    entries: cache.size,
    oldestEntry,
  };
}

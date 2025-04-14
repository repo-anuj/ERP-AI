import { prisma } from '@/lib/prisma';

// Define exchange rate interface
interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

// Cache for exchange rates to minimize API calls
const exchangeRateCache: Record<string, ExchangeRate> = {};

// Default exchange rates for common currencies (relative to USD)
// These are used as fallbacks when API calls fail
const defaultExchangeRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.93,
  GBP: 0.79,
  JPY: 150.59,
  CAD: 1.38,
  AUD: 1.53,
  CHF: 0.90,
  CNY: 7.24,
  INR: 83.36,
  MXN: 16.82,
  BRL: 5.16,
  RUB: 92.14,
  KRW: 1370.23,
  SGD: 1.35,
  NZD: 1.65,
  THB: 36.12,
  SEK: 10.52,
  ZAR: 18.65,
  TRY: 32.15,
  NOK: 10.72,
};

/**
 * Get the exchange rate between two currencies
 * 
 * @param fromCurrency The source currency code (e.g., 'USD')
 * @param toCurrency The target currency code (e.g., 'EUR')
 * @returns The exchange rate as a number
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  // If currencies are the same, return 1
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  // Create a cache key
  const cacheKey = `${fromCurrency}-${toCurrency}`;
  
  // Check if we have a cached rate that's less than 24 hours old
  if (exchangeRateCache[cacheKey]) {
    const cachedRate = exchangeRateCache[cacheKey];
    const cacheAge = new Date().getTime() - cachedRate.lastUpdated.getTime();
    const cacheAgeHours = cacheAge / (1000 * 60 * 60);
    
    if (cacheAgeHours < 24) {
      return cachedRate.rate;
    }
  }
  
  try {
    // Try to fetch the exchange rate from an API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.rates && data.rates[toCurrency]) {
        const rate = data.rates[toCurrency];
        
        // Cache the result
        exchangeRateCache[cacheKey] = {
          from: fromCurrency,
          to: toCurrency,
          rate,
          lastUpdated: new Date(),
        };
        
        return rate;
      }
    }
    
    // If API call fails, calculate using default rates (via USD)
    if (defaultExchangeRates[fromCurrency] && defaultExchangeRates[toCurrency]) {
      // Convert via USD
      const fromToUSD = 1 / defaultExchangeRates[fromCurrency];
      const usdToTarget = defaultExchangeRates[toCurrency];
      const rate = fromToUSD * usdToTarget;
      
      // Cache the result
      exchangeRateCache[cacheKey] = {
        from: fromCurrency,
        to: toCurrency,
        rate,
        lastUpdated: new Date(),
      };
      
      return rate;
    }
    
    // If all else fails, return 1 (no conversion)
    return 1;
  } catch (error) {
    console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
    
    // Use default rates as fallback
    if (defaultExchangeRates[fromCurrency] && defaultExchangeRates[toCurrency]) {
      // Convert via USD
      const fromToUSD = 1 / defaultExchangeRates[fromCurrency];
      const usdToTarget = defaultExchangeRates[toCurrency];
      return fromToUSD * usdToTarget;
    }
    
    // If all else fails, return 1 (no conversion)
    return 1;
  }
}

/**
 * Convert an amount from one currency to another
 * 
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Get the company's default currency
 * 
 * @param companyId The company ID
 * @returns The default currency code (e.g., 'USD')
 */
export async function getCompanyDefaultCurrency(companyId: string): Promise<string> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { defaultCurrency: true },
    });
    
    return company?.defaultCurrency || 'USD';
  } catch (error) {
    console.error('Error fetching company default currency:', error);
    return 'USD';
  }
}

/**
 * Update the company's default currency
 * 
 * @param companyId The company ID
 * @param currency The new default currency code
 * @returns Success status
 */
export async function updateCompanyDefaultCurrency(
  companyId: string,
  currency: string
): Promise<boolean> {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { defaultCurrency: currency },
    });
    
    return true;
  } catch (error) {
    console.error('Error updating company default currency:', error);
    return false;
  }
}

/**
 * Get a list of supported currencies with their names
 * 
 * @returns Array of currency objects with code and name
 */
export function getSupportedCurrencies(): { code: string; name: string }[] {
  return [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'NOK', name: 'Norwegian Krone' },
  ];
}

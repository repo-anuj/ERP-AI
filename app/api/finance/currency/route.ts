import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserCompanyId } from '@/lib/auth';
import { 
  getCompanyDefaultCurrency, 
  updateCompanyDefaultCurrency, 
  getSupportedCurrencies,
  convertCurrency
} from '@/lib/currency-utils';

// Validation schema for updating currency
const currencyUpdateSchema = z.object({
  currency: z.string().length(3, "Currency code must be 3 characters"),
});

/**
 * GET: Get currency settings and supported currencies
 * 
 * Query parameters:
 * - convert: If true, include conversion rates for all currencies
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeConversion = searchParams.get('convert') === 'true';
    
    // Get the company's default currency
    const defaultCurrency = await getCompanyDefaultCurrency(companyId);
    
    // Get the list of supported currencies
    const supportedCurrencies = getSupportedCurrencies();
    
    // If conversion rates are requested, calculate them
    let conversionRates = {};
    
    if (includeConversion) {
      const rates: Record<string, number> = {};
      
      for (const currency of supportedCurrencies) {
        if (currency.code !== defaultCurrency) {
          // Convert 1 unit of default currency to this currency
          const rate = await convertCurrency(1, defaultCurrency, currency.code);
          rates[currency.code] = rate;
        }
      }
      
      conversionRates = rates;
    }
    
    return NextResponse.json({
      defaultCurrency,
      supportedCurrencies,
      ...(includeConversion && { conversionRates }),
    });
  } catch (error: any) {
    console.error('Error fetching currency settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency settings' },
      { status: 500 }
    );
  }
}

/**
 * POST: Update the company's default currency
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and get their company ID
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = currencyUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid currency data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { currency } = validationResult.data;
    
    // Check if the currency is supported
    const supportedCurrencies = getSupportedCurrencies();
    const isCurrencySupported = supportedCurrencies.some(c => c.code === currency);
    
    if (!isCurrencySupported) {
      return NextResponse.json(
        { error: 'Unsupported currency' },
        { status: 400 }
      );
    }
    
    // Update the company's default currency
    const success = await updateCompanyDefaultCurrency(companyId, currency);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update default currency' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      defaultCurrency: currency,
    });
  } catch (error: any) {
    console.error('Error updating default currency:', error);
    return NextResponse.json(
      { error: 'Failed to update default currency' },
      { status: 500 }
    );
  }
}

/**
 * POST: Convert an amount from one currency to another
 * 
 * Request body:
 * {
 *   amount: number,
 *   fromCurrency: string,
 *   toCurrency: string
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const companyId = await getUserCompanyId();
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { amount, fromCurrency, toCurrency } = body;
    
    if (typeof amount !== 'number' || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Invalid conversion data. Required: amount, fromCurrency, toCurrency' },
        { status: 400 }
      );
    }
    
    // Convert the amount
    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
    
    return NextResponse.json({
      originalAmount: amount,
      convertedAmount,
      fromCurrency,
      toCurrency,
      exchangeRate: convertedAmount / amount,
    });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}

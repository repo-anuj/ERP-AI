'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import { formatCurrency } from '@/lib/utils';

/**
 * Hook to format a currency value with automatic conversion to the default currency
 * 
 * @param value The amount to format
 * @param originalCurrency The original currency of the value
 * @param showOriginal Whether to show the original currency in parentheses
 * @returns The formatted currency string
 */
export function useFormattedCurrency(
  value: number,
  originalCurrency: string = 'USD',
  showOriginal: boolean = true
) {
  const { defaultCurrency, convertAmount } = useCurrency();
  const [formattedValue, setFormattedValue] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const formatValue = async () => {
      setIsLoading(true);
      
      try {
        // If the currencies are the same, no conversion needed
        if (originalCurrency === defaultCurrency) {
          setFormattedValue(formatCurrency(value, defaultCurrency));
          setConvertedAmount(value);
        } else {
          // Convert the amount to the default currency
          const converted = await convertAmount(value, originalCurrency);
          setConvertedAmount(converted);
          
          // Format with or without original currency
          setFormattedValue(
            formatCurrency(
              converted, 
              defaultCurrency, 
              'en-US',
              showOriginal ? originalCurrency : undefined
            )
          );
        }
      } catch (error) {
        console.error('Error formatting currency:', error);
        // Fallback to original currency if conversion fails
        setFormattedValue(formatCurrency(value, originalCurrency));
        setConvertedAmount(value);
      } finally {
        setIsLoading(false);
      }
    };

    formatValue();
  }, [value, originalCurrency, defaultCurrency, showOriginal, convertAmount]);

  return {
    formattedValue,
    convertedAmount,
    isLoading,
    originalValue: value,
    originalCurrency,
    targetCurrency: defaultCurrency,
  };
}

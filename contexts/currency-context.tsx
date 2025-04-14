'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { convertCurrency, getSupportedCurrencies } from '@/lib/currency-utils';

interface CurrencyContextType {
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
  supportedCurrencies: { code: string; name: string }[];
  convertAmount: (amount: number, fromCurrency: string) => Promise<number>;
  isLoading: boolean;
  updateDefaultCurrency: (currency: string) => Promise<boolean>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<{ code: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the default currency and supported currencies on mount
  useEffect(() => {
    const fetchCurrencySettings = async () => {
      try {
        const response = await fetch('/api/finance/currency');
        
        if (response.ok) {
          const data = await response.json();
          setDefaultCurrency(data.defaultCurrency);
          setSupportedCurrencies(data.supportedCurrencies);
        }
      } catch (error) {
        console.error('Error fetching currency settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencySettings();
  }, []);

  // Convert an amount from a source currency to the default currency
  const convertAmount = async (amount: number, fromCurrency: string): Promise<number> => {
    if (fromCurrency === defaultCurrency) {
      return amount;
    }

    try {
      const response = await fetch('/api/finance/currency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          fromCurrency,
          toCurrency: defaultCurrency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.convertedAmount;
      }

      // If API call fails, try to convert directly
      return await convertCurrency(amount, fromCurrency, defaultCurrency);
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount if conversion fails
    }
  };

  // Update the default currency
  const updateDefaultCurrency = async (currency: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/finance/currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
        }),
      });

      if (response.ok) {
        setDefaultCurrency(currency);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating default currency:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    defaultCurrency,
    setDefaultCurrency,
    supportedCurrencies,
    convertAmount,
    isLoading,
    updateDefaultCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  
  return context;
}

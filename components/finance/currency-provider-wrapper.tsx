'use client';

import { ReactNode } from 'react';
import { CurrencyProvider } from '@/contexts/currency-context';

interface CurrencyProviderWrapperProps {
  children: ReactNode;
}

export function CurrencyProviderWrapper({ children }: CurrencyProviderWrapperProps) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}

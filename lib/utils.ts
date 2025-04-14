import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @param originalCurrency - The original currency of the value (for display purposes)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  originalCurrency?: string
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  // If original currency is provided and different from display currency,
  // add it to the formatted string
  if (originalCurrency && originalCurrency !== currency) {
    return `${formatted} (${originalCurrency})`;
  }

  return formatted;
}

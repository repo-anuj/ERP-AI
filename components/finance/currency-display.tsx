'use client';

import { useFormattedCurrency } from '@/hooks/use-formatted-currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';

interface CurrencyDisplayProps {
  value: number;
  currency?: string;
  showOriginal?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  value,
  currency = 'USD',
  showOriginal = true,
  showTooltip = true,
  className = '',
}: CurrencyDisplayProps) {
  const { formattedValue, convertedAmount, isLoading, originalValue, originalCurrency, targetCurrency } = 
    useFormattedCurrency(value, currency, showOriginal);

  if (isLoading) {
    return <Skeleton className={`h-4 w-24 ${className}`} />;
  }

  // If no conversion happened or tooltip is disabled, just show the formatted value
  if (!showTooltip || originalCurrency === targetCurrency) {
    return <span className={className}>{formattedValue}</span>;
  }

  // Show tooltip with conversion details
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{formattedValue}</span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>Original: {formatCurrency(originalValue, originalCurrency)}</div>
            <div>Converted: {formatCurrency(convertedAmount || 0, targetCurrency)}</div>
            <div className="text-muted-foreground mt-1">
              Exchange rate: 1 {originalCurrency} = {((convertedAmount || 0) / originalValue).toFixed(4)} {targetCurrency}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

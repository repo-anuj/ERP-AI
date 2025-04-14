'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/contexts/currency-context';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Check } from 'lucide-react';

export function CurrencySettings() {
  const { 
    defaultCurrency, 
    supportedCurrencies, 
    isLoading, 
    updateDefaultCurrency 
  } = useCurrency();
  
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
  };

  const handleSave = async () => {
    if (selectedCurrency === defaultCurrency) {
      return;
    }

    setIsUpdating(true);
    
    try {
      const success = await updateDefaultCurrency(selectedCurrency);
      
      if (success) {
        toast.success(`Default currency updated to ${selectedCurrency}`);
      } else {
        toast.error('Failed to update default currency');
        setSelectedCurrency(defaultCurrency);
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('An error occurred while updating the currency');
      setSelectedCurrency(defaultCurrency);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Settings</CardTitle>
        <CardDescription>
          Set your default currency for the entire ERP system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Currency</label>
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
              disabled={isLoading || isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              This currency will be used as the default display currency throughout the ERP system.
              All financial values will be converted to this currency for display purposes.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setSelectedCurrency(defaultCurrency)}
          disabled={selectedCurrency === defaultCurrency || isLoading || isUpdating}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedCurrency === defaultCurrency || isLoading || isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : selectedCurrency === defaultCurrency ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Current
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Currency
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

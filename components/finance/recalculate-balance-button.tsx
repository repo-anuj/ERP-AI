'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RecalculateBalanceButtonProps {
  accountId?: string;
  onSuccess?: () => void;
}

export function RecalculateBalanceButton({ 
  accountId, 
  onSuccess 
}: RecalculateBalanceButtonProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      
      const response = await fetch('/api/finance/accounts/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recalculate balance');
      }
      
      const data = await response.json();
      
      toast.success(
        accountId 
          ? `Balance recalculated successfully` 
          : `All account balances recalculated`
      );
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error recalculating balance:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to recalculate balance'
      );
    } finally {
      setIsRecalculating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRecalculate}
      disabled={isRecalculating}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
      {isRecalculating 
        ? (accountId ? 'Recalculating...' : 'Recalculating All...') 
        : (accountId ? 'Recalculate Balance' : 'Recalculate All Balances')}
    </Button>
  );
}

'use client';

import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingIndicator({ 
  isLoading, 
  message = 'Loading data...', 
  className = '' 
}: LoadingIndicatorProps) {
  if (!isLoading) return null;
  
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

'use client';

import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          <div className="w-full max-w-md p-6 bg-card text-card-foreground rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
            <p className="mb-4">
              The application encountered a critical error. Our team has been notified.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-[200px] mb-4">
              <p className="font-mono">{error.message || 'An unexpected error occurred'}</p>
              {error.digest && (
                <p className="text-xs opacity-70 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
              <Button onClick={() => reset()}>Try Again</Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

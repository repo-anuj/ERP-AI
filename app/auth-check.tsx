'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie } from '@/lib/cookies';

/**
 * Client-side authentication check component
 * This serves as a fallback in case the middleware fails
 */
export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip auth check for auth pages
    if (pathname?.startsWith('/auth')) {
      setIsChecking(false);
      return;
    }
    
    // Check for token
    const token = getCookie('token');
    
    if (!token) {
      // Redirect to login if no token found
      const redirectUrl = `/auth/signin?from=${encodeURIComponent(pathname || '/')}`;
      router.push(redirectUrl);
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);
  
  // Show nothing while checking auth
  if (isChecking && !pathname?.startsWith('/auth')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

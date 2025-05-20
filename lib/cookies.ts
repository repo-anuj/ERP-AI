/**
 * Client-side cookie utilities
 */

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return undefined;
}

/**
 * Set a cookie
 */
export function setCookie(
  name: string, 
  value: string, 
  options: { 
    days?: number; 
    path?: string; 
    secure?: boolean; 
    sameSite?: 'strict' | 'lax' | 'none' 
  } = {}
): void {
  if (typeof document === 'undefined') return;
  
  const { days = 1, path = '/', secure = true, sameSite = 'lax' } = options;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=${path}${secure ? '; secure' : ''}; samesite=${sameSite}`;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

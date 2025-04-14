/**
 * Simple in-memory cache for analytics data
 * This helps reduce database load for frequently accessed analytics
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of entries to store

class AnalyticsCache {
  private cache: Map<string, CacheEntry>;
  private static instance: AnalyticsCache;

  private constructor() {
    this.cache = new Map<string, CacheEntry>();
  }

  public static getInstance(): AnalyticsCache {
    if (!AnalyticsCache.instance) {
      AnalyticsCache.instance = new AnalyticsCache();
    }
    return AnalyticsCache.instance;
  }

  /**
   * Generate a cache key from the request parameters
   */
  public generateKey(params: any): string {
    // Sort the keys to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj: any, key) => {
        obj[key] = params[key];
        return obj;
      }, {});
    
    return JSON.stringify(sortedParams);
  }

  /**
   * Get data from cache if it exists and is not expired
   */
  public get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
      // Entry has expired, remove it
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Store data in the cache
   */
  public set(key: string, data: any): void {
    // If cache is at max size, remove the oldest entry
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  /**
   * Find the oldest entry in the cache
   */
  private getOldestKey(): string | null {
    let oldestTimestamp = Infinity;
    let oldestKey: string | null = null;
    
    this.cache.forEach((entry) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = entry.key;
      }
    });
    
    return oldestKey;
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Remove a specific entry from the cache
   */
  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number, maxSize: number, ttl: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL
    };
  }
}

export const analyticsCache = AnalyticsCache.getInstance();

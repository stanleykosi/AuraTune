/**
 * Simple in-memory cache for Spotify API responses
 * This helps reduce API calls and improve response times
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SpotifyCache {
  private static instance: SpotifyCache;
  private cache: Map<string, CacheEntry<any>>;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): SpotifyCache {
    if (!SpotifyCache.instance) {
      SpotifyCache.instance = new SpotifyCache();
    }
    return SpotifyCache.instance;
  }

  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public clear(): void {
    this.cache.clear();
  }

  public remove(key: string): void {
    this.cache.delete(key);
  }
}

export const spotifyCache = SpotifyCache.getInstance(); 
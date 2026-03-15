// utils/cache.js
// Lightweight in-memory cache with TTL for external fetch results

class SimpleCache {
  constructor(ttlMs = 300000) {
    this.ttl = ttlMs;
    this.store = new Map();
  }

  async get(key, fetcher) {
    const now = Date.now();
    const entry = this.store.get(key);
    if (entry && (now - entry.time) < this.ttl) {
      return entry.value;
    }
    const value = await fetcher();
    this.store.set(key, { value, time: now });
    return value;
  }
}

// Export a shared cache instance (default TTL: 5 minutes)
export default new SimpleCache(300000);

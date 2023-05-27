// Define LRUCache class with private properties capacity, ttl, and cache
export class LRUCache {
  // Capacity of the cache
  private capacity: number;
  // Time-to-live (TTL) in milliseconds
  private ttl: number;
  // Cache map that stores key-value pairs with a timestamp
  private cache: Map<string, { timestamp: number; value: any }>;

  // Constructor takes capacity and ttl as arguments and initializes the cache map
  constructor(capacity: number, ttl: number) {
    this.capacity = capacity;
    this.ttl = ttl;
    this.cache = new Map();
  }

  // Get method takes a key and returns the cached value or null if not found or expired
  get(key: string): any | null {
    const cachedItem = this.cache.get(key);
    // If cached item is not found or it's expired, return null
    if (!cachedItem || Date.now() - cachedItem.timestamp > this.ttl) {
      return null;
    }
    // Update the timestamp of the cached item to mark it as recently used
    cachedItem.timestamp = Date.now();
    return cachedItem.value;
  }

  // Set method takes a key and value and stores it in the cache
  set(key: string, value: any): void {
    // If cache is at capacity, remove the least recently used (LRU) item
    if (this.cache.size >= this.capacity) {
      const lruKey = Array.from(this.cache.keys())[0];
      this.cache.delete(lruKey);
    }
    // Add the new item to the cache with a timestamp
    this.cache.set(key, { timestamp: Date.now(), value });
  }
}

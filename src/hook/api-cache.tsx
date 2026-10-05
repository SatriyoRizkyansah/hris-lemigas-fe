const network_cache = new Map();

// Function untuk clear cache berdasarkan pattern
export const clearCacheByPattern = (pattern: string | RegExp) => {
  const keys = Array.from(network_cache.keys());
  keys.forEach((key) => {
    if (typeof pattern === "string") {
      if (key.includes(pattern)) {
        network_cache.delete(key);
      }
    } else {
      if (pattern.test(key)) {
        network_cache.delete(key);
      }
    }
  });
};

// Function untuk clear semua cache
export const clearAllCache = () => {
  network_cache.clear();
};

export default network_cache;

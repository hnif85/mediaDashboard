// Rate limiting configuration for external APIs
module.exports = {
  // Telegram API rate limiting
  telegram: {
    minRequestInterval: 1000, // 1 second between requests
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds initial delay
    retryBackoff: true, // Use exponential backoff
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache TTL
  },
  
  // AI Service rate limiting
  aiService: {
    minRequestInterval: 500, // 0.5 seconds between requests
    maxRetries: 2,
    retryDelay: 1000,
    cacheTTL: 10 * 60 * 1000, // 10 minutes cache TTL
  },
  
  // Global rate limiting headers (if API provides them)
  parseRateLimitHeaders: (headers) => {
    const limits = {};
    
    if (headers['x-ratelimit-limit']) {
      limits.limit = parseInt(headers['x-ratelimit-limit']);
    }
    
    if (headers['x-ratelimit-remaining']) {
      limits.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    
    if (headers['x-ratelimit-reset']) {
      limits.reset = parseInt(headers['x-ratelimit-reset']);
    }
    
    if (headers['retry-after']) {
      limits.retryAfter = parseInt(headers['retry-after']);
    }
    
    return limits;
  },
  
  // Calculate wait time based on rate limit headers
  calculateWaitTime: (rateLimitHeaders) => {
    if (rateLimitHeaders.retryAfter) {
      return rateLimitHeaders.retryAfter * 1000; // Convert to milliseconds
    }
    
    if (rateLimitHeaders.reset) {
      const now = Date.now();
      const resetTime = rateLimitHeaders.reset * 1000;
      return Math.max(0, resetTime - now);
    }
    
    return null; // No specific wait time available
  }
};
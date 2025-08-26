const axios = require('axios');
const rateLimitConfig = require('../config/rateLimit');

class TelegramService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.apiHost = process.env.RAPIDAPI_HOST;
    this.baseURL = `https://${this.apiHost}`;
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    
    // Debug logging untuk environment variables
    console.log('TelegramService initialized:');
    console.log('RAPIDAPI_KEY:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'UNDEFINED');
    console.log('RAPIDAPI_HOST:', this.apiHost || 'UNDEFINED');
    
    // Use centralized configuration
    this.minRequestInterval = rateLimitConfig.telegram.minRequestInterval;
    this.maxRetries = rateLimitConfig.telegram.maxRetries;
    this.retryDelay = rateLimitConfig.telegram.retryDelay;
    this.cacheTTL = rateLimitConfig.telegram.cacheTTL;
    
    // Simple in-memory cache (consider using Redis for production)
    this.cache = new Map();
  }

  async getChannelInfo(channelName) {
    const cacheKey = `info:${channelName}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Using cached channel info for ${channelName}`);
      return cached;
    }

    try {
      const response = await this.makeRequestWithRetry(
        `${this.baseURL}/channel/info`,
        { channel: channelName },
        'Failed to fetch channel info'
      );
      
      // Cache the successful response
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Channel info error for ${channelName}:`, error.message);
      throw error;
    }
  }

  async getChannelMessages(channelName, limit = 5, maxId = 999999999) {
    const cacheKey = `messages:${channelName}:${limit}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Using cached messages for ${channelName}`);
      return cached;
    }

    try {
      const response = await this.makeRequestWithRetry(
        `${this.baseURL}/channel/message`,
        {
          channel: channelName,
          limit: limit,
          max_id: maxId
        },
        'Failed to fetch channel messages'
      );
      
      // Cache the successful response
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Channel messages error for ${channelName}:`, error.message);
      
      // Return mock data when API fails (fallback)
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        console.log(`Using fallback mock messages for ${channelName} due to rate limiting`);
        return this.generateMockMessages(channelName, limit);
      }
      
      throw error;
    }
  }

  async makeRequestWithRetry(url, params, errorMessage, retryCount = 0) {
    try {
      // Rate limiting: wait if needed
      await this.enforceRateLimit();
      
      // Debug logging untuk memverifikasi API key yang digunakan
      console.log('Making request to RapidAPI:');
      console.log('URL:', url);
      console.log('API Host:', this.apiHost);
      console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'UNDEFINED');
      console.log('Params:', params);
      
      const response = await axios.get(url, {
        params: params,
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      return response;
    } catch (error) {
      // Handle rate limiting specifically
      if (error.response?.status === 429 && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(url, params, errorMessage, retryCount + 1);
      }
      
      // Handle other errors
      if (error.response) {
        // Server responded with error status
        throw new Error(`${errorMessage}: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(`${errorMessage}: No response from server`);
      } else {
        // Something else happened
        throw new Error(`${errorMessage}: ${error.message}`);
      }
    }
  }

  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key); // Remove expired cache
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  generateMockMessages(channelName, limit) {
    console.log(`Generating mock messages for ${channelName}`);
    
    const messages = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // 1 day apart
      messages.push({
        id: Date.now() + i,
        date: date.toISOString(),
        text: `Sample message ${i + 1} from ${channelName}. This is placeholder content for demonstration purposes.`,
        views: Math.floor(Math.random() * 1000) + 100,
        video: { url: null },
        photo: { url: null }
      });
    }
    
    return messages;
  }

  extractChannelName(telegramLink) {
    // Extract channel name from various Telegram URL formats
    const patterns = [
      /t\.me\/([^\/\?]+)/,
      /telegram\.me\/([^\/\?]+)/,
      /telegram\.org\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = telegramLink.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If it's already just a channel name
    if (!telegramLink.includes('/') && !telegramLink.includes('.')) {
      return telegramLink;
    }

    throw new Error('Invalid Telegram channel link format');
  }
}

module.exports = new TelegramService();
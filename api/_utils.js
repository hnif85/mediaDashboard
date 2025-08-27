// Utility functions for Vercel environment
const path = require('path');
const fs = require('fs');

// Load environment variables for Vercel
function loadVercelEnv() {
  // Check if we're running on Vercel
  if (process.env.VERCEL) {
    // Vercel provides environment variables automatically
    return;
  }

  // For local development, load from .env file
  const envPath = path.join(process.cwd(), '..', '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    console.warn('.env file not found, using process.env');
  }
}

// Get API base URL based on environment
function getApiBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.VITE_API_BASE_URL || 'http://localhost:3001';
}

module.exports = {
  loadVercelEnv,
  getApiBaseUrl
};
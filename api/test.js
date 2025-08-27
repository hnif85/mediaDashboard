// Test endpoint untuk verifikasi deployment
const express = require('express');
const { loadVercelEnv } = require('./_utils');

// Load environment variables
loadVercelEnv();

const app = express();

app.use(express.json());

// Test endpoint untuk verifikasi deployment
app.get('/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL,
    nodeVersion: process.version,
    region: process.env.VERCEL_REGION
  });
});

// Test database connection
app.get('/test/db', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.json({
        success: false,
        message: 'Database credentials not configured',
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_ANON_KEY
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test simple query
    const { data, error } = await supabase
      .from('channels')
      .select('count')
      .limit(1);

    res.json({
      success: true,
      message: 'Database connection successful',
      data: data || [],
      error: error ? error.message : null
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test environment variables
app.get('/test/env', (req, res) => {
  const envVars = {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL,
    vercelRegion: process.env.VERCEL_REGION,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasTelegramApi: !!process.env.TELEGRAM_API_ID,
    hasOpenAi: !!process.env.OPENAI_API_KEY
  };

  res.json(envVars);
});

module.exports = app;
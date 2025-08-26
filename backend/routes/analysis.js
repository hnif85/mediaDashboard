const express = require('express');
const Joi = require('joi');
const telegramService = require('../services/telegramService');
const aiService = require('../services/aiService');
const supabase = require('../config/supabase');
const router = express.Router();

// Validation schema
const analysisSchema = Joi.object({
  channelLink: Joi.string().required().min(3).max(200)
});

// Analyze channel
router.post('/analyze', async (req, res) => {
  try {
    const { error, value } = analysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { channelLink } = value;
    const channelName = telegramService.extractChannelName(channelLink);
    
    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('channel_analyses')
      .select('*')
      .eq('channel_name', channelName)
      .single();

    if (existingAnalysis) {
      return res.json({
        success: true,
        data: existingAnalysis,
        cached: true
      });
    }

    // Fetch channel data with error handling for rate limits
    let channelInfo, messages;
    try {
      [channelInfo, messages] = await Promise.all([
        telegramService.getChannelInfo(channelName),
        telegramService.getChannelMessages(channelName, 5)
      ]);
    } catch (error) {
      // Handle rate limiting specifically
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'Telegram API rate limit reached. Please try again in a few moments.',
          retryAfter: 60 // seconds
        });
      }
      
      // Handle other API errors
      console.error('Telegram API error:', error);
      return res.status(502).json({
        error: 'Service Unavailable',
        message: 'Unable to fetch channel data from Telegram API. Please try again later.'
      });
    }

    // Perform AI analysis
    const analysis = await aiService.analyzeChannel(channelInfo, messages);

    // Save to database
    const analysisRecord = {
      channel_name: channelName,
      channel_link: channelLink,
      channel_info: channelInfo,
      messages: messages,
      analysis_result: analysis,
      created_at: new Date().toISOString()
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('channel_analyses')
      .insert([analysisRecord])
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      // Return analysis even if save fails
      return res.json({
        success: true,
        data: { ...analysisRecord, id: Date.now() },
        warning: 'Analysis completed but not saved to database'
      });
    }

    res.json({
      success: true,
      data: savedAnalysis,
      cached: false
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error.message.includes('Invalid Telegram channel link')) {
      return res.status(400).json({
        error: 'Invalid Channel Link',
        message: 'Please provide a valid Telegram channel link.'
      });
    }
    
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Get analysis by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: analysis, error } = await supabase
      .from('channel_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis',
      message: error.message 
    });
  }
});

// Get all analyses
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('channel_analyses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (rating) {
      query = query.eq('analysis_result->verdict->rating', rating);
    }

    const { data: analyses, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analyses',
      message: error.message 
    });
  }
});

module.exports = router;
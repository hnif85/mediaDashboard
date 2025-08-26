const express = require('express');
const Joi = require('joi');
const telegramService = require('../services/telegramService');
const router = express.Router();

// Validation schema
const channelSchema = Joi.object({
  channelLink: Joi.string().required().min(3).max(200)
});

// Get channel info
router.post('/info', async (req, res) => {
  try {
    const { error, value } = channelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { channelLink } = value;
    const channelName = telegramService.extractChannelName(channelLink);
    
    const channelInfo = await telegramService.getChannelInfo(channelName);
    
    res.json({
      success: true,
      data: channelInfo,
      channelName
    });
  } catch (error) {
    console.error('Channel info error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch channel info',
      message: error.message 
    });
  }
});

// Get channel messages
router.post('/messages', async (req, res) => {
  try {
    const { error, value } = channelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { channelLink } = value;
    const channelName = telegramService.extractChannelName(channelLink);
    
    const messages = await telegramService.getChannelMessages(channelName, 5);
    
    res.json({
      success: true,
      data: messages,
      channelName
    });
  } catch (error) {
    console.error('Channel messages error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch channel messages',
      message: error.message 
    });
  }
});

// Get complete channel data
router.post('/complete', async (req, res) => {
  try {
    const { error, value } = channelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { channelLink } = value;
    const channelName = telegramService.extractChannelName(channelLink);
    
    // Fetch both info and messages
    const [channelInfo, messages] = await Promise.all([
      telegramService.getChannelInfo(channelName),
      telegramService.getChannelMessages(channelName, 5)
    ]);
    
    res.json({
      success: true,
      data: {
        info: channelInfo,
        messages: messages,
        channelName
      }
    });
  } catch (error) {
    console.error('Complete channel data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch complete channel data',
      message: error.message 
    });
  }
});

module.exports = router;
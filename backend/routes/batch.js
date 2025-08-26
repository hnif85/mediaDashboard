const express = require('express');
const Joi = require('joi');
const queueService = require('../services/queueService');
const router = express.Router();

// Validation schema for batch analysis
const batchAnalysisSchema = Joi.object({
  channelLinks: Joi.array()
    .items(Joi.string().min(3).max(200))
    .min(1)
    .max(20) // Limit to 20 channels per batch to prevent abuse
    .required()
    .messages({
      'array.min': 'At least one channel link is required',
      'array.max': 'Maximum 20 channels allowed per batch'
    })
});

// Start batch analysis
router.post('/analyze', async (req, res) => {
  try {
    const { error, value } = batchAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation Error',
        details: error.details[0].message 
      });
    }

    const { channelLinks } = value;
    
    // Remove duplicates
    const uniqueLinks = [...new Set(channelLinks)];
    
    const jobId = await queueService.addBatch(uniqueLinks);
    
    res.json({
      success: true,
      jobId,
      message: `Batch analysis started for ${uniqueLinks.length} channels`,
      totalChannels: uniqueLinks.length
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Failed to start batch analysis',
      message: error.message
    });
  }
});

// Get job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = queueService.getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The specified job ID does not exist or has been cleaned up'
      });
    }

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error.message
    });
  }
});

// Get queue status
router.get('/queue-status', async (req, res) => {
  try {
    const status = queueService.getQueueStatus();
    
    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
});

// Cancel job
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = queueService.cancelJob(jobId);
    
    if (!cancelled) {
      return res.status(400).json({
        error: 'Cannot cancel job',
        message: 'Job is already processing or completed'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      error: 'Failed to cancel job',
      message: error.message
    });
  }
});

// Get active jobs
router.get('/active', async (req, res) => {
  try {
    const activeJobs = queueService.getActiveJobs();
    
    res.json({
      success: true,
      activeJobs,
      count: activeJobs.length
    });

  } catch (error) {
    console.error('Active jobs error:', error);
    res.status(500).json({
      error: 'Failed to get active jobs',
      message: error.message
    });
  }
});

module.exports = router;
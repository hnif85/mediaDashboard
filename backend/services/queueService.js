const { EventEmitter } = require('events');
const telegramService = require('./telegramService');
const aiService = require('./aiService');
const supabase = require('../config/supabase');

class QueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.activeJobs = new Map();
    this.maxConcurrent = 2; // Process 2 channels at a time to respect rate limits
    this.jobStatus = new Map();
  }

  // Add multiple channels to queue
  async addBatch(channelLinks) {
    const jobId = Date.now().toString();
    const job = {
      id: jobId,
      channels: channelLinks.map(link => ({
        link: link.trim(),
        status: 'pending',
        result: null,
        error: null
      })),
      createdAt: new Date(),
      status: 'pending',
      completed: 0,
      total: channelLinks.length
    };

    this.queue.push(job);
    this.jobStatus.set(jobId, job);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  // Process the queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs.size < this.maxConcurrent) {
      const job = this.queue.shift();
      this.activeJobs.set(job.id, job);
      
      // Process each channel in the job
      this.processJob(job);
    }

    this.processing = false;
  }

  // Process a single job (batch of channels)
  async processJob(job) {
    job.status = 'processing';
    this.emit('jobUpdate', job);

    for (let i = 0; i < job.channels.length; i++) {
      const channel = job.channels[i];
      
      try {
        channel.status = 'processing';
        this.emit('jobUpdate', job);

        // Process the channel
        const result = await this.processSingleChannel(channel.link);
        
        channel.status = 'completed';
        channel.result = result;
        job.completed++;
        
        this.emit('jobUpdate', job);
        this.emit('channelComplete', { jobId: job.id, channel: channel.link, result });

      } catch (error) {
        channel.status = 'failed';
        channel.error = error.message;
        job.completed++;
        
        this.emit('jobUpdate', job);
        this.emit('channelError', { jobId: job.id, channel: channel.link, error: error.message });
      }

      // Add small delay between channels to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    job.status = 'completed';
    this.activeJobs.delete(job.id);
    this.emit('jobUpdate', job);
    this.emit('jobComplete', job);
  }

  // Process a single channel (reusing existing analysis logic)
  async processSingleChannel(channelLink) {
    const channelName = telegramService.extractChannelName(channelLink);
    
    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('channel_analyses')
      .select('*')
      .eq('channel_name', channelName)
      .single();

    if (existingAnalysis) {
      return {
        success: true,
        data: existingAnalysis,
        cached: true
      };
    }

    // Fetch channel data
    let channelInfo, messages;
    try {
      [channelInfo, messages] = await Promise.all([
        telegramService.getChannelInfo(channelName),
        telegramService.getChannelMessages(channelName, 5)
      ]);
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('Rate Limited: Please try again later');
      }
      throw error;
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
      return {
        success: true,
        data: { ...analysisRecord, id: Date.now() },
        warning: 'Analysis completed but not saved to database'
      };
    }

    return {
      success: true,
      data: savedAnalysis,
      cached: false
    };
  }

  // Get job status
  getJobStatus(jobId) {
    return this.jobStatus.get(jobId);
  }

  // Get all active jobs
  getActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.getActiveJobs(),
      processing: this.processing
    };
  }

  // Cancel a job
  cancelJob(jobId) {
    const job = this.jobStatus.get(jobId);
    if (job && job.status === 'pending') {
      this.queue = this.queue.filter(j => j.id !== jobId);
      this.jobStatus.delete(jobId);
      return true;
    }
    return false;
  }

  // Clear completed jobs (older than 1 hour)
  cleanupOldJobs() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [jobId, job] of this.jobStatus.entries()) {
      if (job.status === 'completed' && job.createdAt < oneHourAgo) {
        this.jobStatus.delete(jobId);
      }
    }
  }
}

// Create singleton instance
const queueService = new QueueService();

// Clean up old jobs every hour
setInterval(() => {
  queueService.cleanupOldJobs();
}, 60 * 60 * 1000);

module.exports = queueService;
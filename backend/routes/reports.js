const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Generate CSV report
router.get('/csv', async (req, res) => {
  try {
    const { rating, dateFrom, dateTo } = req.query;

    let query = supabase
      .from('channel_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (rating) {
      query = query.eq('analysis_result->verdict->rating', rating);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: analyses, error } = await query;

    if (error) {
      throw error;
    }

    // Generate CSV content
    const csvHeaders = [
      'Channel Name',
      'Channel Link', 
      'Subscribers',
      'Trust Score',
      'Rating',
      'Bio Consistency',
      'Content Relevance',
      'Engagement Ratio',
      'Scam Indicators',
      'Analysis Date'
    ];

    const csvRows = analyses.map(analysis => {
      const result = analysis.analysis_result;
      const info = analysis.channel_info;
      
      return [
        `"${info.title || analysis.channel_name}"`,
        `"${analysis.channel_link}"`,
        info.subscribers || 0,
        result.verdict?.trustScore || 0,
        `"${result.verdict?.rating || 'Unknown'}"`,
        `"${result.profileCheck?.bioConsistency || 'Unknown'}"`,
        `"${result.contentCheck?.relevance || 'Unknown'}"`,
        `"${result.contentCheck?.engagementMetrics?.engagementRatio || '0%'}"`,
        `"${result.contentCheck?.scamIndicators?.join('; ') || 'None'}"`,
        new Date(analysis.created_at).toLocaleDateString()
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="telegram-analysis-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ 
      error: 'Failed to generate CSV report',
      message: error.message 
    });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: analyses, error } = await supabase
      .from('channel_analyses')
      .select('analysis_result, created_at');

    if (error) {
      throw error;
    }

    const stats = {
      totalAnalyses: analyses.length,
      ratingDistribution: {
        'Legit': 0,
        'Doubtful': 0,
        'Scam Risk': 0
      },
      averageTrustScore: 0,
      analysesThisMonth: 0,
      topScamIndicators: {}
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let totalTrustScore = 0;

    analyses.forEach(analysis => {
      const result = analysis.analysis_result;
      const createdDate = new Date(analysis.created_at);
      
      // Rating distribution
      const rating = result.verdict?.rating || 'Unknown';
      if (stats.ratingDistribution[rating] !== undefined) {
        stats.ratingDistribution[rating]++;
      }

      // Trust score
      totalTrustScore += result.verdict?.trustScore || 0;

      // This month count
      if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        stats.analysesThisMonth++;
      }

      // Scam indicators
      const indicators = result.contentCheck?.scamIndicators || [];
      indicators.forEach(indicator => {
        stats.topScamIndicators[indicator] = (stats.topScamIndicators[indicator] || 0) + 1;
      });
    });

    stats.averageTrustScore = analyses.length > 0 ? Math.round(totalTrustScore / analyses.length) : 0;

    // Convert scam indicators to sorted array
    stats.topScamIndicators = Object.entries(stats.topScamIndicators)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([indicator, count]) => ({ indicator, count }));

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

module.exports = router;
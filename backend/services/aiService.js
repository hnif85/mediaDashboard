const axios = require('axios');

class AIService {
  constructor() {
    this.aiService = process.env.AI_SERVICE || 'deepseek';
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com';
  }

  async analyzeChannel(channelInfo, messages) {
    const prompt = this.buildAnalysisPrompt(channelInfo, messages);
    
    try {
      let response;
      
      if (!this.apiKey) {
        throw new Error('DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY environment variable.');
      }

      if (this.aiService === 'deepseek') {
        // Use DeepSeek API directly via HTTP
        response = await axios.post(`${this.baseURL}/chat/completions`, {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a Telegram Channel Auditor AI. Analyze the given channel data and return ONLY valid JSON without any additional text or formatting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const analysisText = response.data.choices[0].message.content.trim();
      
      // Clean and parse JSON response
      const cleanedJson = this.cleanJsonResponse(analysisText);
      return JSON.parse(cleanedJson);
      
      } else {
        throw new Error(`Unsupported AI service: ${this.aiService}`);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error.message);
      throw error; // Re-throw the error instead of falling back to mock
    }
  }

  buildAnalysisPrompt(channelInfo, messages) {
    const avgViews = messages.length > 0 
      ? Math.round(messages.reduce((sum, msg) => sum + parseInt(msg.views || 0), 0) / messages.length)
      : 0;

    return `Analyze this Telegram channel:

CHANNEL INFO:
- Name: ${channelInfo.title}
- Description: ${channelInfo.description}
- Subscribers: ${channelInfo.subscribers}
- Verified: ${channelInfo.verified}
- Type: ${channelInfo.chat_type}

RECENT MESSAGES (${messages.length} posts):
${messages.map((msg, i) => `
Post ${i + 1}:
- Date: ${msg.date}
- Views: ${msg.views}
- Text: ${msg.text.substring(0, 200)}...
- Has Video: ${!!msg.video.url}
- Has Photo: ${!!msg.photo.url}
`).join('')}

METRICS:
- Average views per post: ${avgViews}
- Engagement ratio: ${((avgViews / parseInt(channelInfo.subscribers)) * 100).toFixed(2)}%

Return analysis in this EXACT JSON format:
{
  "profileCheck": {
    "bioConsistency": "clear/vague/misleading",
    "externalLinks": "official/suspicious/none", 
    "ownerContact": "present/absent",
    "score": 0
  },
  "contentCheck": {
    "relevance": "crypto-related/general/spammy",
    "activityLevel": "active/inactive",
    "engagementMetrics": {
      "subscriberCount": ${channelInfo.subscribers},
      "avgViewsPerPost": ${avgViews},
      "engagementRatio": "${((avgViews / parseInt(channelInfo.subscribers)) * 100).toFixed(2)}%",
      "avgCommentsPerPost": 0,
      "avgReactionsPerPost": 0
    },
    "scamIndicators": [],
    "score": 0
  },
  "crossCheck": {
    "officialReferences": "yes/no",
    "inconsistencies": [],
    "score": 0
  },
  "verdict": {
    "trustScore": 0,
    "rating": "Legit/Doubtful/Scam Risk",
    "explanation": "Brief explanation"
  }
}`;
  }

  cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Find the first { and last } to extract just the JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  }

}

module.exports = new AIService();
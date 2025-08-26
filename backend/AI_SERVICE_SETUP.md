# AI Service Configuration

## Overview

This application has been modified to work without OpenAI dependency. The AI service now supports multiple configurations:

## Configuration Options

### 1. DeepSeek API (Recommended)
- Set `AI_SERVICE=deepseek` in your `.env` file
- Add your DeepSeek API key: `DEEPSEEK_API_KEY=your_api_key_here`
- The service will make direct HTTP requests to DeepSeek API

### 2. Mock Mode (Default Fallback)
- If no API key is configured, the service automatically uses mock responses
- Mock responses provide realistic analysis data for development and testing
- No external API calls are made

### 3. Environment Variables

Add these to your `.env` file:

```env
# AI Service Configuration
AI_SERVICE=deepseek  # Options: deepseek (or leave empty for mock mode)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## Getting DeepSeek API Key

1. Visit [DeepSeek Official Website](https://platform.deepseek.com/)
2. Sign up for an account
3. Navigate to API section to get your API key
4. Copy the key and add it to your `.env` file

## Testing

The application will work immediately without any API key:
- Mock responses are generated for development
- Real API calls are made only when `DEEPSEEK_API_KEY` is provided
- Error handling ensures the application never crashes due to API issues

## Removing OpenAI Dependency

The OpenAI package has been removed from dependencies. If you want to completely remove it:

```bash
npm uninstall openai
```

## Benefits

- No OpenAI API key required
- Lower cost (DeepSeek is more affordable)
- Better privacy (optional local mock mode)
- More flexible architecture
- Automatic fallback to mock responses
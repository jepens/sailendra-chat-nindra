import { logger } from '@/utils/logger';
import { SentimentResult, SentimentType, EmotionType } from '@/types/sentiment';

// OpenAI configuration
const OPENAI_CONFIG = {
  model: 'gpt-3.5-turbo',
  maxTokens: 150, // Keep response short for cost efficiency
  temperature: 0.1, // Low temperature for consistent results
  // GPT-3.5-turbo pricing: $0.0010 / 1K input tokens, $0.0020 / 1K output tokens
};

// Cost tracking
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

// OpenAI response interface
interface OpenAISentimentResponse {
  sentiment: SentimentType;
  confidence: number;
  emotions: { [key: string]: number };
  keywords: string[];
  reasoning?: string;
}

class OpenAISentimentService {
  private isConfigured: boolean = false;
  private apiKey: string | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || null;
    
    if (!this.apiKey) {
      logger.warn('OpenAI API key not found. OpenAI sentiment analysis will be disabled.');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    logger.info('OpenAI client initialized successfully');
  }

  // Optimized prompt for Indonesian customer service context
  private createSentimentPrompt(message: string): string {
    return `Analyze the sentiment of this customer message in Indonesian/English customer service context.

Message: "${message}"

Respond with ONLY a JSON object in this exact format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "emotions": {
    "joy": 0.3,
    "trust": 0.4,
    "anger": 0.1
  },
  "keywords": ["senang", "puas", "bagus"],
  "reasoning": "Customer expresses satisfaction with service"
}

Rules:
1. sentiment: positive/negative/neutral only
2. confidence: 0.0-1.0 (how certain you are)
3. emotions: only include emotions with score > 0.1, max 5 emotions
4. keywords: max 5 relevant sentiment words found
5. reasoning: brief explanation (optional, keep short)
6. Consider Indonesian cultural context and common expressions
7. Focus on customer service satisfaction indicators`;
  }

  // Calculate cost based on token usage
  private calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): TokenUsage {
    const inputCostPer1K = 0.0010; // $0.001 per 1K input tokens
    const outputCostPer1K = 0.0020; // $0.002 per 1K output tokens

    const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1K;
    const outputCost = (usage.completion_tokens / 1000) * outputCostPer1K;
    const totalCost = inputCost + outputCost;

    return {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.prompt_tokens + usage.completion_tokens,
      estimatedCostUSD: Math.round(totalCost * 100000) / 100000 // Round to 5 decimal places
    };
  }

  // Parse OpenAI response safely
  private parseOpenAIResponse(content: string): OpenAISentimentResponse | null {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      // Validate required fields
      if (!parsed.sentiment || !parsed.confidence) {
        logger.warn('OpenAI response missing required fields:', parsed);
        return null;
      }

      // Validate sentiment value
      if (!['positive', 'negative', 'neutral'].includes(parsed.sentiment)) {
        logger.warn('Invalid sentiment value from OpenAI:', parsed.sentiment);
        return null;
      }

      // Validate confidence range
      if (parsed.confidence < 0 || parsed.confidence > 1) {
        logger.warn('Invalid confidence value from OpenAI:', parsed.confidence);
        parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
      }

      return {
        sentiment: parsed.sentiment as SentimentType,
        confidence: parsed.confidence,
        emotions: parsed.emotions || {},
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
        reasoning: parsed.reasoning
      };

    } catch (error) {
      logger.error('Failed to parse OpenAI response:', error, 'Content:', content);
      return null;
    }
  }

  // Main analysis method
  async analyzeSentiment(message: string): Promise<{
    result: SentimentResult | null;
    tokenUsage: TokenUsage | null;
    rawResponse?: any;
  }> {
    if (!this.isConfigured) {
      logger.warn('OpenAI not configured, skipping analysis');
      return { result: null, tokenUsage: null };
    }

    // Skip very short messages to save costs
    if (message.trim().length < 3) {
      logger.debug('Message too short for OpenAI analysis, skipping');
      return { result: null, tokenUsage: null };
    }

    const startTime = Date.now();

    try {
      const prompt = this.createSentimentPrompt(message);

      // Make fetch request to OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const usage = data.usage;
      const content = data.choices[0]?.message?.content;

      if (!content || !usage) {
        logger.error('Invalid OpenAI response structure');
        return { result: null, tokenUsage: null };
      }

      const tokenUsage = this.calculateCost(usage);
      const parsedResponse = this.parseOpenAIResponse(content);

      if (!parsedResponse) {
        logger.error('Failed to parse OpenAI sentiment response');
        return { result: null, tokenUsage };
      }

      const result: SentimentResult = {
        sentiment: parsedResponse.sentiment,
        confidence: parsedResponse.confidence,
        emotions: parsedResponse.emotions as { [key in EmotionType]?: number },
        keywords: parsedResponse.keywords,
        language: 'id' // Assume Indonesian context
      };

      logger.debug('OpenAI sentiment analysis completed:', {
        message: message.substring(0, 50) + '...',
        sentiment: result.sentiment,
        confidence: result.confidence,
        tokens: tokenUsage.totalTokens,
        cost: tokenUsage.estimatedCostUSD,
        processingTimeMs: processingTime
      });

      return {
        result,
        tokenUsage,
        rawResponse: {
          openai_response: parsedResponse,
          processing_time_ms: processingTime,
          model_used: OPENAI_CONFIG.model
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('OpenAI sentiment analysis failed:', error, {
        message: message.substring(0, 50) + '...',
        processingTimeMs: processingTime
      });

      return { result: null, tokenUsage: null };
    }
  }

  // Cost estimation for planning
  estimateCost(messageCount: number, avgMessageLength: number = 50): {
    estimatedTokens: number;
    estimatedCostUSD: number;
  } {
    // Rough estimation: prompt ~200 tokens + message length + completion ~50 tokens
    const avgTokensPerMessage = 200 + Math.ceil(avgMessageLength / 3) + 50;
    const totalTokens = messageCount * avgTokensPerMessage;
    
    // Estimate 80% input, 20% output tokens
    const inputTokens = Math.ceil(totalTokens * 0.8);
    const outputTokens = Math.ceil(totalTokens * 0.2);
    
    const inputCost = (inputTokens / 1000) * 0.0010;
    const outputCost = (outputTokens / 1000) * 0.0020;
    const totalCost = inputCost + outputCost;

    return {
      estimatedTokens: totalTokens,
      estimatedCostUSD: Math.round(totalCost * 100000) / 100000
    };
  }

  // Health check
  async healthCheck(): Promise<{ 
    configured: boolean; 
    accessible?: boolean; 
    error?: string 
  }> {
    if (!this.isConfigured) {
      return { configured: false, error: 'API key not configured' };
    }

    try {
      // Simple test call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      });

      return { configured: true, accessible: response.ok };
    } catch (error) {
      return { 
        configured: true, 
        accessible: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get current configuration
  getConfig() {
    return {
      configured: this.isConfigured,
      model: OPENAI_CONFIG.model,
      maxTokens: OPENAI_CONFIG.maxTokens,
      temperature: OPENAI_CONFIG.temperature
    };
  }
}

// Export singleton instance
export const openaiSentimentService = new OpenAISentimentService();

export { OpenAISentimentService, type TokenUsage }; 
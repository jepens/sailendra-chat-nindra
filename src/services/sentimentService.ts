import { supabase } from '@/integrations/supabase/client';
import { 
  SentimentAnalysis, 
  SentimentResult, 
  SentimentBatch, 
  SentimentStats, 
  SentimentFilter,
  SentimentConfig,
  SentimentType,
  EmotionType 
} from '@/types/sentiment';
import { logger } from '@/utils/logger';

// Default configuration
const DEFAULT_CONFIG: SentimentConfig = {
  provider: 'local',
  language: 'id', // Indonesian by default
  enable_emotions: true,
  enable_keywords: true,
  batch_size: 10,
  auto_analyze: true,
  confidence_threshold: 0.5,
};

// Local sentiment analysis using simple rule-based approach
class LocalSentimentAnalyzer {
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private emotionWords: Map<EmotionType, string[]>;

  constructor() {
    // Indonesian positive words
    this.positiveWords = new Set([
      'bagus', 'baik', 'senang', 'suka', 'terima kasih', 'mantap', 'keren', 'top',
      'excellent', 'good', 'great', 'awesome', 'amazing', 'perfect', 'love',
      'happy', 'satisfied', 'pleased', 'wonderful', 'fantastic', 'brilliant',
      'hebat', 'luar biasa', 'puas', 'memuaskan', 'recommended', 'terbaik',
      'sukses', 'berhasil', 'lancar', 'mudah', 'cepat', 'ramah', 'helpful'
    ]);

    // Indonesian negative words
    this.negativeWords = new Set([
      'buruk', 'jelek', 'kecewa', 'marah', 'benci', 'payah', 'gagal', 'error',
      'bad', 'terrible', 'awful', 'hate', 'angry', 'disappointed', 'frustrated',
      'poor', 'worst', 'horrible', 'disgusting', 'annoying', 'stupid',
      'lambat', 'susah', 'sulit', 'ribet', 'mahal', 'tidak puas', 'komplain',
      'masalah', 'trouble', 'problem', 'issue', 'broken', 'rusak', 'salah'
    ]);

    // Emotion mapping
    this.emotionWords = new Map([
      ['joy', ['senang', 'gembira', 'bahagia', 'happy', 'joy', 'excited', 'cheerful']],
      ['anger', ['marah', 'kesal', 'angry', 'mad', 'furious', 'irritated', 'upset']],
      ['fear', ['takut', 'khawatir', 'cemas', 'afraid', 'scared', 'worried', 'anxious']],
      ['sadness', ['sedih', 'kecewa', 'sad', 'disappointed', 'depressed', 'down']],
      ['surprise', ['kaget', 'heran', 'surprised', 'amazed', 'shocked', 'astonished']],
      ['disgust', ['jijik', 'muak', 'disgusted', 'revolted', 'sick', 'grossed']],
      ['trust', ['percaya', 'yakin', 'trust', 'confident', 'reliable', 'faithful']],
      ['anticipation', ['harap', 'nantikan', 'expect', 'anticipate', 'await', 'eager']]
    ]);
  }

  analyze(text: string): SentimentResult {
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    const emotions: { [key in EmotionType]?: number } = {};
    const keywords: string[] = [];

    // Count sentiment words
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (this.positiveWords.has(cleanWord)) {
        positiveScore++;
        keywords.push(cleanWord);
      }
      
      if (this.negativeWords.has(cleanWord)) {
        negativeScore++;
        keywords.push(cleanWord);
      }

      // Check emotions
      this.emotionWords.forEach((emotionWords, emotion) => {
        if (emotionWords.includes(cleanWord)) {
          emotions[emotion] = (emotions[emotion] || 0) + 1;
        }
      });
    });

    // Determine sentiment
    let sentiment: SentimentType;
    let confidence: number;

    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveScore - negativeScore) * 0.1);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeScore - positiveScore) * 0.1);
    } else {
      sentiment = 'neutral';
      confidence = positiveScore + negativeScore > 0 ? 0.6 : 0.8;
    }

    // Normalize emotions
    const totalEmotions = Object.values(emotions).reduce((sum, count) => sum + count, 0);
    if (totalEmotions > 0) {
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion as EmotionType] = emotions[emotion as EmotionType]! / totalEmotions;
      });
    }

    return {
      sentiment,
      confidence,
      emotions: Object.keys(emotions).length > 0 ? emotions : undefined,
      keywords: keywords.length > 0 ? [...new Set(keywords)] : undefined,
      language: 'id'
    };
  }
}

// External API providers
class ExternalSentimentProvider {
  constructor(private config: SentimentConfig) {}

  async analyze(text: string): Promise<SentimentResult> {
    switch (this.config.provider) {
      case 'azure':
        return this.analyzeWithAzure(text);
      case 'google':
        return this.analyzeWithGoogle(text);
      case 'aws':
        return this.analyzeWithAWS(text);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async analyzeWithAzure(text: string): Promise<SentimentResult> {
    if (!this.config.api_key || !this.config.endpoint) {
      throw new Error('Azure API key and endpoint required');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/text/analytics/v3.1/sentiment`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: [{
            id: '1',
            language: this.config.language,
            text: text
          }]
        })
      });

      const result = await response.json();
      const doc = result.documents[0];

      return {
        sentiment: doc.sentiment as SentimentType,
        confidence: Math.max(
          doc.confidenceScores.positive,
          doc.confidenceScores.negative,
          doc.confidenceScores.neutral
        ),
        language: this.config.language
      };
    } catch (error) {
      logger.error('Azure sentiment analysis failed:', error as Error);
      throw error;
    }
  }

  private async analyzeWithGoogle(text: string): Promise<SentimentResult> {
    if (!this.config.api_key) {
      throw new Error('Google API key required');
    }

    try {
      const response = await fetch(
        `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${this.config.api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document: {
              type: 'PLAIN_TEXT',
              language: this.config.language,
              content: text
            }
          })
        }
      );

      const result = await response.json();
      const score = result.documentSentiment.score;
      const magnitude = result.documentSentiment.magnitude;

      let sentiment: SentimentType;
      if (score > 0.25) sentiment = 'positive';
      else if (score < -0.25) sentiment = 'negative';
      else sentiment = 'neutral';

      return {
        sentiment,
        confidence: Math.min(0.95, magnitude),
        language: this.config.language
      };
    } catch (error) {
      logger.error('Google sentiment analysis failed:', error as Error);
      throw error;
    }
  }

  private async analyzeWithAWS(text: string): Promise<SentimentResult> {
    // AWS Comprehend implementation would go here
    throw new Error('AWS Comprehend not yet implemented');
  }
}

// Main sentiment service
class SentimentService {
  private localAnalyzer: LocalSentimentAnalyzer;
  private externalProvider: ExternalSentimentProvider | null = null;
  private config: SentimentConfig;

  constructor() {
    this.localAnalyzer = new LocalSentimentAnalyzer();
    this.config = DEFAULT_CONFIG;
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      // Load config from settings service or database
      // For now, use default config
      this.config = { ...DEFAULT_CONFIG };
      
      if (this.config.provider !== 'local') {
        this.externalProvider = new ExternalSentimentProvider(this.config);
      }
    } catch (error) {
      logger.warn('Failed to load sentiment config, using defaults:', error as Error);
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      if (this.config.provider === 'local' || !this.externalProvider) {
        return this.localAnalyzer.analyze(text);
      } else {
        // Try external provider first, fallback to local
        try {
          return await this.externalProvider.analyze(text);
        } catch (error) {
          logger.warn('External sentiment analysis failed, falling back to local:', error as Error);
          return this.localAnalyzer.analyze(text);
        }
      }
    } catch (error) {
      logger.error('Sentiment analysis failed:', error as Error);
      throw error;
    }
  }

  async analyzeMessage(messageId: string, sessionId: string, content: string): Promise<SentimentAnalysis> {
    const result = await this.analyzeSentiment(content);
    
    const sentimentData: Omit<SentimentAnalysis, 'id' | 'created_at' | 'updated_at'> = {
      message_id: messageId,
      session_id: sessionId,
      sentiment: result.sentiment,
      confidence: result.confidence,
      emotions: result.emotions,
      keywords: result.keywords,
      language: result.language,
      analyzed_at: new Date().toISOString()
    };

    // Save to database
    const { data, error } = await supabase
      .from('sentiment_analysis')
      .insert([sentimentData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to save sentiment analysis:', error);
      throw error;
    }

    return data;
  }

  async analyzeBatch(messages: SentimentBatch[]): Promise<SentimentAnalysis[]> {
    const results: SentimentAnalysis[] = [];
    const batchSize = this.config.batch_size;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(msg => this.analyzeMessage(msg.message_id, msg.session_id, msg.content))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error(`Failed to analyze message ${batch[index].message_id}:`, result.reason);
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async getSentimentStats(filter: SentimentFilter = {}): Promise<SentimentStats> {
    let query = supabase
      .from('sentiment_analysis')
      .select('*');

    // Apply filters
    if (filter.session_id) {
      query = query.eq('session_id', filter.session_id);
    }
    if (filter.sentiment) {
      query = query.eq('sentiment', filter.sentiment);
    }
    if (filter.date_from) {
      query = query.gte('analyzed_at', filter.date_from);
    }
    if (filter.date_to) {
      query = query.lte('analyzed_at', filter.date_to);
    }
    if (filter.min_confidence) {
      query = query.gte('confidence', filter.min_confidence);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch sentiment stats:', error);
      throw error;
    }

    // Calculate statistics
    const total = data.length;
    const positive = data.filter(d => d.sentiment === 'positive').length;
    const negative = data.filter(d => d.sentiment === 'negative').length;
    const neutral = data.filter(d => d.sentiment === 'neutral').length;

    const avgConfidence = total > 0 
      ? data.reduce((sum, d) => sum + d.confidence, 0) / total 
      : 0;

    // Calculate emotion distribution
    const emotionCounts: { [key in EmotionType]?: number } = {};
    data.forEach(d => {
      if (d.emotions) {
        Object.entries(d.emotions).forEach(([emotion, score]) => {
          emotionCounts[emotion as EmotionType] = (emotionCounts[emotion as EmotionType] || 0) + (score as number);
        });
      }
    });

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        count: count || 0,
        percentage: total > 0 ? ((count || 0) / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trend (simplified - by day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = data
      .filter(d => new Date(d.analyzed_at) >= thirtyDaysAgo)
      .reduce((acc, d) => {
        const date = d.analyzed_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { positive: 0, negative: 0, neutral: 0 };
        }
        acc[date][d.sentiment]++;
        return acc;
      }, {} as { [date: string]: { positive: number; negative: number; neutral: number } });

    const sentiment_trend = Object.entries(trendData).map(([date, counts]) => ({
      date,
      ...counts
    }));

    return {
      total_messages: total,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      positive_percentage: total > 0 ? (positive / total) * 100 : 0,
      negative_percentage: total > 0 ? (negative / total) * 100 : 0,
      neutral_percentage: total > 0 ? (neutral / total) * 100 : 0,
      average_confidence: avgConfidence,
      top_emotions: topEmotions,
      sentiment_trend
    };
  }

  async getSentimentForMessage(messageId: string): Promise<SentimentAnalysis | null> {
    const { data, error } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      logger.error('Failed to fetch sentiment for message:', error);
      throw error;
    }

    return data;
  }

  async getSentimentForSession(sessionId: string): Promise<SentimentAnalysis[]> {
    const { data, error } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .eq('session_id', sessionId)
      .order('analyzed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch sentiment for session:', error);
      throw error;
    }

    return data || [];
  }

  updateConfig(newConfig: Partial<SentimentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.provider !== 'local') {
      this.externalProvider = new ExternalSentimentProvider(this.config);
    } else {
      this.externalProvider = null;
    }
  }

  getConfig(): SentimentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const sentimentService = new SentimentService();

// Export types and individual functions
export {
  SentimentService,
  LocalSentimentAnalyzer,
  ExternalSentimentProvider
}; 
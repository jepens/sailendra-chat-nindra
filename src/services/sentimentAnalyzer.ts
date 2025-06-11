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

// Main sentiment service
class SentimentService {
  private localAnalyzer: LocalSentimentAnalyzer;
  private config: SentimentConfig;

  constructor() {
    this.localAnalyzer = new LocalSentimentAnalyzer();
    this.config = DEFAULT_CONFIG;
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      return this.localAnalyzer.analyze(text);
    } catch (error) {
      logger.error('Sentiment analysis failed:', error as Error);
      throw error;
    }
  }

  async analyzeMessage(messageId: string, sessionId: string, content: string): Promise<SentimentAnalysis> {
    const result = await this.analyzeSentiment(content);
    
    const sentimentData: SentimentAnalysis = {
      id: crypto.randomUUID(),
      message_id: messageId,
      session_id: sessionId,
      sentiment: result.sentiment,
      confidence: result.confidence,
      emotions: result.emotions,
      keywords: result.keywords,
      language: result.language,
      analyzed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return sentimentData;
  }

  async getSentimentStats(filter: SentimentFilter = {}): Promise<SentimentStats> {
    // Mock data for development - replace with actual database queries
    return {
      total_messages: 150,
      positive_count: 80,
      negative_count: 25,
      neutral_count: 45,
      positive_percentage: 53.3,
      negative_percentage: 16.7,
      neutral_percentage: 30.0,
      average_confidence: 0.75,
      top_emotions: [
        { emotion: 'joy', count: 45, percentage: 30 },
        { emotion: 'trust', count: 32, percentage: 21.3 },
        { emotion: 'anger', count: 18, percentage: 12 },
        { emotion: 'sadness', count: 12, percentage: 8 },
        { emotion: 'surprise', count: 8, percentage: 5.3 },
      ],
      sentiment_trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        positive: Math.floor(Math.random() * 20) + 5,
        negative: Math.floor(Math.random() * 10) + 2,
        neutral: Math.floor(Math.random() * 15) + 3,
      }))
    };
  }

  async analyzeBatch(messages: SentimentBatch[]): Promise<SentimentAnalysis[]> {
    const results: SentimentAnalysis[] = [];
    
    for (const message of messages) {
      try {
        const analysis = await this.analyzeMessage(
          message.message_id, 
          message.session_id, 
          message.content
        );
        results.push(analysis);
      } catch (error) {
        logger.error(`Failed to analyze message ${message.message_id}:`, error as Error);
      }
    }
    
    return results;
  }

  getConfig(): SentimentConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SentimentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const sentimentService = new SentimentService();

export {
  SentimentService,
  LocalSentimentAnalyzer
}; 
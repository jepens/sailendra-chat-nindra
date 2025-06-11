import { supabase } from '@/integrations/supabase/client';
import { openaiSentimentService } from './openaiSentimentService';
import { sentimentService as localSentimentService } from './sentimentAnalyzer';
import { logger } from '@/utils/logger';
import { 
  SentimentAnalysis, 
  SentimentResult, 
  SentimentStats, 
  SentimentFilter,
  SentimentType,
  EmotionType 
} from '@/types/sentiment';

interface HybridSentimentConfig {
  useOpenAI: boolean;
  fallbackToLocal: boolean;
  openaiThreshold: number;
  confidenceThreshold: number;
  costLimit: number;
  maxTokensPerDay: number;
}

class HybridSentimentService {
  private config: HybridSentimentConfig = {
    useOpenAI: true,
    fallbackToLocal: true,
    openaiThreshold: 10,
    confidenceThreshold: 0.7,
    costLimit: 5.00,
    maxTokensPerDay: 50000
  };

  private dailyStats = {
    totalProcessed: 0,
    openaiUsed: 0,
    localUsed: 0,
    totalTokens: 0,
    totalCostUSD: 0
  };

  // Check if we can use OpenAI today
  private canUseOpenAI(): boolean {
    return this.config.useOpenAI && 
           this.dailyStats.totalCostUSD < this.config.costLimit &&
           this.dailyStats.totalTokens < this.config.maxTokensPerDay;
  }

  // Smart decision making for analysis method
  private shouldUseOpenAI(message: string, localResult?: SentimentResult): boolean {
    if (!this.canUseOpenAI()) return false;
    if (message.trim().length < this.config.openaiThreshold) return false;
    if (localResult && localResult.confidence >= this.config.confidenceThreshold) return false;
    
    // Complex cases that benefit from OpenAI
    const isComplex = message.length > 100 || 
                     /[\u{1F600}-\u{1F64F}]/u.test(message) || // Has emoji
                     /\b(ya|iya|oh|wah|lah)\b.*\b(bagus|mantap|keren)\b/i.test(message); // Sarcasm patterns
    
    return isComplex;
  }

  // Main analysis method
  async analyzeMessage(messageId: string, sessionId: string, content: string): Promise<SentimentAnalysis> {
    const startTime = Date.now();
    
    try {
      // First, try local analysis
      const localResult = await localSentimentService.analyzeSentiment(content);
      let finalResult = localResult;
      let analysisProvider: 'openai' | 'local' | 'hybrid' = 'local';
      let tokenUsage: any = null;

      // Decide if we should also use OpenAI
      if (this.shouldUseOpenAI(content, localResult)) {
        try {
          const { result: openaiResult, tokenUsage: openaiTokens } = 
            await openaiSentimentService.analyzeSentiment(content);

          if (openaiResult) {
            finalResult = openaiResult;
            analysisProvider = 'openai';
            tokenUsage = openaiTokens;

            // Update daily stats
            this.dailyStats.openaiUsed++;
            this.dailyStats.totalTokens += openaiTokens?.totalTokens || 0;
            this.dailyStats.totalCostUSD += openaiTokens?.estimatedCostUSD || 0;
          }
        } catch (openaiError) {
          if (this.config.fallbackToLocal) {
            analysisProvider = 'hybrid';
            logger.warn('OpenAI failed, using local fallback:', openaiError);
          } else {
            throw openaiError;
          }
        }
      }

      if (analysisProvider === 'local') {
        this.dailyStats.localUsed++;
      }
      this.dailyStats.totalProcessed++;

      const processingTime = Date.now() - startTime;

      // Save to database and return the saved result
      const savedAnalysis = await this.saveSentimentAnalysis(
        parseInt(messageId),
        sessionId,
        content,
        finalResult,
        analysisProvider,
        tokenUsage,
        processingTime
      );

      logger.debug('Sentiment analysis completed and saved:', {
        id: savedAnalysis.id,
        messageId,
        sentiment: finalResult.sentiment,
        provider: analysisProvider,
        processingTime
      });

      return savedAnalysis;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Hybrid sentiment analysis failed:', error, {
        messageId,
        sessionId,
        processingTime
      });
      throw error;
    }
  }

  // Get sentiment statistics
  async getSentimentStats(filter: SentimentFilter = {}): Promise<SentimentStats> {
    try {
      console.log('🔍 getSentimentStats called with filter:', filter);
      
      // Test Supabase connection first
      const { error: connectionError } = await supabase
        .from('sentiment_analysis')
        .select('id')
        .limit(1);

      if (connectionError) {
        logger.error('Supabase connection failed:', connectionError);
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }

      // First, get total count to debug
      const { count: totalCount, error: countError } = await supabase
        .from('sentiment_analysis')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Error getting count:', countError);
      } else {
        console.log('📊 Total records in sentiment_analysis:', totalCount);
      }

      let query = supabase
        .from('sentiment_analysis')
        .select(`
          id,
          sentiment,
          confidence_score,
          emotions,
          analyzed_at,
          session_id,
          created_at
        `);

      // Apply filters
      if (filter.session_id) {
        query = query.eq('session_id', filter.session_id);
        console.log('Applied session filter:', filter.session_id);
      }
      
      if (filter.sentiment) {
        query = query.eq('sentiment', filter.sentiment);
        console.log('Applied sentiment filter:', filter.sentiment);
      }
      
      if (filter.date_from) {
        query = query.gte('analyzed_at', filter.date_from);
        console.log('Applied date_from filter:', filter.date_from);
      }
      
      if (filter.date_to) {
        query = query.lte('analyzed_at', filter.date_to);
        console.log('Applied date_to filter:', filter.date_to);
      }
      
      if (filter.min_confidence) {
        query = query.gte('confidence_score', filter.min_confidence);
        console.log('Applied confidence filter:', filter.min_confidence);
      }

      const { data: sentimentData, error } = await query;

      console.log('📊 Query result:', { data: sentimentData, error });

      if (error) {
        logger.error('Failed to fetch sentiment data:', error);
        throw error;
      }

      if (!sentimentData || sentimentData.length === 0) {
        // Check if there are any records at all without filters
        const { data: allData, count: allCount } = await supabase
          .from('sentiment_analysis')
          .select('sentiment', { count: 'exact' })
          .limit(1);
        
        console.log('🔍 Total records without filter:', allCount);
        console.log('🔍 Sample record:', allData);
        
        logger.info(`No sentiment data found with current filters. Total records in DB: ${allCount}`);
        return {
          total_messages: 0,
          positive_count: 0,
          negative_count: 0,
          neutral_count: 0,
          positive_percentage: 0,
          negative_percentage: 0,
          neutral_percentage: 0,
          average_confidence: 0,
          top_emotions: [],
          sentiment_trend: []
        };
      }

      console.log('✅ Processing sentiment data:', sentimentData.length, 'records');

      // Calculate statistics
      const totalMessages = sentimentData.length;
      const positiveCount = sentimentData.filter(s => s.sentiment === 'positive').length;
      const negativeCount = sentimentData.filter(s => s.sentiment === 'negative').length;
      const neutralCount = sentimentData.filter(s => s.sentiment === 'neutral').length;

      console.log('📊 Sentiment counts:', { 
        total: totalMessages, 
        positive: positiveCount, 
        negative: negativeCount, 
        neutral: neutralCount 
      });

      const positivePercentage = totalMessages > 0 ? (positiveCount / totalMessages) * 100 : 0;
      const negativePercentage = totalMessages > 0 ? (negativeCount / totalMessages) * 100 : 0;
      const neutralPercentage = totalMessages > 0 ? (neutralCount / totalMessages) * 100 : 0;

      const averageConfidence = totalMessages > 0 ? 
        sentimentData.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / totalMessages : 0;

      // Calculate top emotions
      const emotionCounts: { [key: string]: number } = {};
      sentimentData.forEach(s => {
        if (s.emotions && typeof s.emotions === 'object') {
          Object.entries(s.emotions).forEach(([emotion, score]) => {
            if (typeof score === 'number' && score > 0.3) { // Only count significant emotions
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
            }
          });
        }
      });

      const topEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([emotion, count]) => ({
          emotion: emotion as EmotionType,
          count,
          percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0
        }));

      // Calculate sentiment trend for last 7 days
      const sentimentTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = sentimentData.filter(s => {
          if (!s.analyzed_at) return false;
          const analyzedDate = new Date(s.analyzed_at).toISOString().split('T')[0];
          return analyzedDate === dateStr;
        });

        sentimentTrend.push({
          date: dateStr,
          positive: dayData.filter(s => s.sentiment === 'positive').length,
          negative: dayData.filter(s => s.sentiment === 'negative').length,
          neutral: dayData.filter(s => s.sentiment === 'neutral').length,
        });
      }

      const result = {
        total_messages: totalMessages,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        positive_percentage: Math.round(positivePercentage * 10) / 10,
        negative_percentage: Math.round(negativePercentage * 10) / 10,
        neutral_percentage: Math.round(neutralPercentage * 10) / 10,
        average_confidence: Math.round(averageConfidence * 1000) / 1000,
        top_emotions: topEmotions,
        sentiment_trend: sentimentTrend
      };

      console.log('✅ Final sentiment stats:', result);
      return result;

    } catch (error) {
      logger.error('Failed to get sentiment statistics:', error);
      // Fallback to empty stats in case of error
      return {
        total_messages: 0,
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        positive_percentage: 0,
        negative_percentage: 0,
        neutral_percentage: 0,
        average_confidence: 0,
        top_emotions: [],
        sentiment_trend: []
      };
    }
  }

  // Get daily usage stats
  async getDailyStats() {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Query today's sentiment analysis records
      const { data: todayData, error } = await supabase
        .from('sentiment_analysis')
        .select('tokens_used, analysis_provider')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (error) {
        logger.error('Failed to fetch daily stats:', error);
        return {
          ...this.dailyStats,
          remainingCost: Math.max(0, this.config.costLimit - this.dailyStats.totalCostUSD),
          remainingTokens: Math.max(0, this.config.maxTokensPerDay - this.dailyStats.totalTokens)
        };
      }

      // Calculate real statistics from database
      const totalProcessed = todayData?.length || 0;
      const openaiUsed = todayData?.filter(d => d.analysis_provider === 'openai').length || 0;
      const localUsed = todayData?.filter(d => d.analysis_provider === 'local').length || 0;
      const hybridUsed = todayData?.filter(d => d.analysis_provider === 'hybrid').length || 0;
      
      const totalTokens = todayData?.reduce((sum, d) => sum + (d.tokens_used || 0), 0) || 0;
      const totalCostUSD = totalTokens * 0.0000015; // Approx cost per token for GPT-3.5-turbo

      return {
        totalProcessed,
        openaiUsed,
        localUsed: localUsed + hybridUsed,
        totalTokens,
        totalCostUSD,
        remainingCost: Math.max(0, this.config.costLimit - totalCostUSD),
        remainingTokens: Math.max(0, this.config.maxTokensPerDay - totalTokens)
      };

    } catch (error) {
      logger.error('Failed to get daily stats:', error);
      return {
        ...this.dailyStats,
        remainingCost: Math.max(0, this.config.costLimit - this.dailyStats.totalCostUSD),
        remainingTokens: Math.max(0, this.config.maxTokensPerDay - this.dailyStats.totalTokens)
      };
    }
  }

  // Save sentiment analysis to database
  async saveSentimentAnalysis(
    messageId: number, 
    sessionId: string, 
    content: string, 
    result: SentimentResult, 
    provider: 'openai' | 'local' | 'hybrid',
    tokenUsage?: { totalTokens: number; estimatedCostUSD: number },
    processingTime?: number
  ): Promise<SentimentAnalysis> {
    try {
      const sentimentAnalysis = {
        message_id: messageId,
        session_id: sessionId,
        message_content: content,
        sentiment: result.sentiment,
        confidence_score: result.confidence,
        emotions: result.emotions || null,
        keywords: result.keywords || null,
        analysis_provider: provider,
        tokens_used: tokenUsage?.totalTokens || null,
        processing_time_ms: processingTime || null,
        analyzed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sentiment_analysis')
        .insert(sentimentAnalysis)
        .select()
        .single();

      if (error) {
        logger.error('Failed to save sentiment analysis:', error);
        throw error;
      }

      logger.info('Sentiment analysis saved to database:', {
        id: data.id,
        messageId,
        sentiment: result.sentiment,
        provider
      });

      return {
        id: data.id,
        message_id: messageId.toString(),
        session_id: sessionId,
        sentiment: result.sentiment,
        confidence: result.confidence,
        emotions: result.emotions,
        keywords: result.keywords,
        language: result.language,
        analyzed_at: data.analyzed_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

    } catch (error) {
      logger.error('Failed to save sentiment analysis:', error);
      throw error;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<HybridSentimentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Hybrid sentiment config updated:', this.config);
  }

  // Get current configuration
  getConfig(): HybridSentimentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const hybridSentimentService = new HybridSentimentService(); 
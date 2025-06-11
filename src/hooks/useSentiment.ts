import { useState, useEffect, useCallback } from 'react';
import { sentimentService } from '@/services/sentimentAnalyzer';
import { 
  SentimentAnalysis, 
  SentimentStats, 
  SentimentFilter, 
  SentimentBatch,
  SentimentConfig 
} from '@/types/sentiment';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface UseSentimentOptions {
  autoAnalyze?: boolean;
  sessionId?: string;
  enableRealtime?: boolean;
}

export const useSentiment = (options: UseSentimentOptions = {}) => {
  const { autoAnalyze = true, sessionId, enableRealtime = false } = options;
  const { toast } = useToast();

  // State management
  const [sentiments, setSentiments] = useState<SentimentAnalysis[]>([]);
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<SentimentConfig>(sentimentService.getConfig());
  const [error, setError] = useState<string | null>(null);

  // Analyze single message
  const analyzeMessage = useCallback(async (messageId: string, sessionId: string, content: string) => {
    if (analyzing.has(messageId)) return null;

    try {
      setAnalyzing(prev => new Set(prev).add(messageId));
      setError(null);

      const analysis = await sentimentService.analyzeMessage(messageId, sessionId, content);
      
      // Update sentiments array
      setSentiments(prev => {
        const filtered = prev.filter(s => s.message_id !== messageId);
        return [analysis, ...filtered];
      });

      logger.debug('Message sentiment analyzed:', { messageId, sentiment: analysis.sentiment });
      return analysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sentiment analysis failed';
      setError(errorMessage);
      logger.error('Failed to analyze message sentiment:', error as Error);
      
      toast({
        title: "Sentiment Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setAnalyzing(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }, [analyzing, toast]);

  // Analyze multiple messages in batch
  const analyzeBatch = useCallback(async (messages: SentimentBatch[]) => {
    if (messages.length === 0) return [];

    try {
      setLoading(true);
      setError(null);

      const results = await sentimentService.analyzeBatch(messages);
      
      // Update sentiments array
      setSentiments(prev => {
        const messageIds = new Set(messages.map(m => m.message_id));
        const filtered = prev.filter(s => !messageIds.has(s.message_id));
        return [...results, ...filtered];
      });

      toast({
        title: "Batch Analysis Complete",
        description: `Analyzed ${results.length} messages successfully`,
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch analysis failed';
      setError(errorMessage);
      logger.error('Failed to analyze batch:', error as Error);
      
      toast({
        title: "Batch Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load sentiment statistics
  const loadStats = useCallback(async (filter: SentimentFilter = {}) => {
    try {
      setLoading(true);
      setError(null);

      const statistics = await sentimentService.getSentimentStats(filter);
      setStats(statistics);

      return statistics;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load stats';
      setError(errorMessage);
      logger.error('Failed to load sentiment stats:', error as Error);
      
      toast({
        title: "Stats Loading Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get sentiment for specific message
  const getSentimentForMessage = useCallback((messageId: string): SentimentAnalysis | null => {
    return sentiments.find(s => s.message_id === messageId) || null;
  }, [sentiments]);

  // Get sentiments for session
  const getSentimentsForSession = useCallback((sessionId: string): SentimentAnalysis[] => {
    return sentiments.filter(s => s.session_id === sessionId);
  }, [sentiments]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<SentimentConfig>) => {
    try {
      sentimentService.updateConfig(newConfig);
      setConfig(sentimentService.getConfig());
      
      toast({
        title: "Configuration Updated",
        description: "Sentiment analysis configuration has been updated",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update config';
      setError(errorMessage);
      
      toast({
        title: "Configuration Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Clear all sentiments
  const clearSentiments = useCallback(() => {
    setSentiments([]);
    setStats(null);
    setError(null);
  }, []);

  // Get summary for session
  const getSessionSummary = useCallback((sessionId: string) => {
    const sessionSentiments = getSentimentsForSession(sessionId);
    
    if (sessionSentiments.length === 0) {
      return null;
    }

    const total = sessionSentiments.length;
    const positive = sessionSentiments.filter(s => s.sentiment === 'positive').length;
    const negative = sessionSentiments.filter(s => s.sentiment === 'negative').length;
    const neutral = sessionSentiments.filter(s => s.sentiment === 'neutral').length;

    const avgConfidence = sessionSentiments.reduce((sum, s) => sum + s.confidence, 0) / total;

    let overallSentiment: 'positive' | 'negative' | 'neutral';
    if (positive > negative && positive > neutral) {
      overallSentiment = 'positive';
    } else if (negative > positive && negative > neutral) {
      overallSentiment = 'negative';
    } else {
      overallSentiment = 'neutral';
    }

    return {
      overall_sentiment: overallSentiment,
      sentiment_distribution: {
        positive: (positive / total) * 100,
        negative: (negative / total) * 100,
        neutral: (neutral / total) * 100,
      },
      average_confidence: avgConfidence,
      total_analyzed: total,
      last_analysis_date: sessionSentiments[0]?.analyzed_at
    };
  }, [getSentimentsForSession]);

  // Auto-analyze message effect
  useEffect(() => {
    if (!autoAnalyze) return;

    // This would be triggered by new messages
    // Implementation depends on how messages are received
    logger.debug('Auto-analyze enabled for sentiment analysis');
  }, [autoAnalyze]);

  // Load initial stats for session
  useEffect(() => {
    if (sessionId) {
      loadStats({ session_id: sessionId });
    }
  }, [sessionId, loadStats]);

  // Real-time updates effect
  useEffect(() => {
    if (!enableRealtime) return;

    // Setup real-time subscription for sentiment updates
    // This would integrate with your WebSocket or SSE setup
    logger.debug('Real-time sentiment updates enabled');

    return () => {
      // Cleanup real-time subscription
      logger.debug('Cleaning up real-time sentiment subscription');
    };
  }, [enableRealtime]);

  return {
    // State
    sentiments,
    stats,
    loading,
    analyzing: analyzing.size > 0,
    analyzingMessages: Array.from(analyzing),
    config,
    error,

    // Actions
    analyzeMessage,
    analyzeBatch,
    loadStats,
    updateConfig,
    clearSentiments,

    // Getters
    getSentimentForMessage,
    getSentimentsForSession,
    getSessionSummary,

    // Utils
    isAnalyzing: (messageId: string) => analyzing.has(messageId),
    hasError: error !== null,
    hasSentiments: sentiments.length > 0,
  };
};

// Specialized hook for session-level sentiment analysis
export const useSessionSentiment = (sessionId: string) => {
  return useSentiment({ 
    sessionId, 
    autoAnalyze: true, 
    enableRealtime: true 
  });
};

// Specialized hook for message-level sentiment analysis
export const useMessageSentiment = (messageId: string, sessionId: string, content: string) => {
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await sentimentService.analyzeMessage(messageId, sessionId, content);
      setSentiment(result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [messageId, sessionId, content]);

  return {
    sentiment,
    loading,
    error,
    analyze,
    hasError: error !== null,
    hasSentiment: sentiment !== null,
  };
}; 
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EnhancedAnalytics {
  averageResponseTime: number; // in minutes
  customerSatisfactionScore: number; // 0-100
  peakHours: PeakHourData[];
  resolutionRate: number; // percentage
}

export interface PeakHourData {
  hour: string;
  count: number;
}

export interface ResponseTimeData {
  sessionId: string;
  responseTime: number; // in minutes
}

class EnhancedAnalyticsService {
  
  async getAverageResponseTime(): Promise<number> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get chat messages from last 24 hours
      const { data: messages, error } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) return 0;

      // Group messages by session and calculate response times
      const sessionMessages = new Map<string, any[]>();
      
      messages.forEach(msg => {
        if (!sessionMessages.has(msg.session_id)) {
          sessionMessages.set(msg.session_id, []);
        }
        sessionMessages.get(msg.session_id)!.push(msg);
      });

      let totalResponseTimes: number[] = [];

      sessionMessages.forEach(sessionMsgs => {
        for (let i = 0; i < sessionMsgs.length - 1; i++) {
          const currentMsg = sessionMsgs[i];
          const nextMsg = sessionMsgs[i + 1];
          
          // Parse message content
          const currentMsgContent = typeof currentMsg.message === 'string' 
            ? JSON.parse(currentMsg.message) 
            : currentMsg.message;
          const nextMsgContent = typeof nextMsg.message === 'string'
            ? JSON.parse(nextMsg.message)
            : nextMsg.message;

          // Check if current is human and next is bot
          if (currentMsgContent.type === 'human' && nextMsgContent.type === 'ai') {
            const responseTime = (new Date(nextMsg.created_at).getTime() - new Date(currentMsg.created_at).getTime()) / (1000 * 60); // in minutes
            if (responseTime > 0 && responseTime < 60) { // Only count reasonable response times (< 1 hour)
              totalResponseTimes.push(responseTime);
            }
          }
        }
      });

      if (totalResponseTimes.length === 0) return 0;

      const avgResponseTime = totalResponseTimes.reduce((sum, time) => sum + time, 0) / totalResponseTimes.length;
      return Math.round(avgResponseTime * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      logger.error('Failed to calculate average response time:', error);
      return 0;
    }
  }

  async getCustomerSatisfactionScore(): Promise<number> {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get satisfaction scores from session sentiment summary
      const { data: satisfactionData, error } = await supabase
        .from('session_sentiment_summary')
        .select('satisfaction_score')
        .gte('last_analyzed_at', oneWeekAgo.toISOString())
        .not('satisfaction_score', 'is', null);

      if (error) throw error;

      if (!satisfactionData || satisfactionData.length === 0) return 75; // Default score

      const scores = satisfactionData
        .map(item => item.satisfaction_score)
        .filter(score => score !== null) as number[];

      if (scores.length === 0) return 75;

      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return Math.round(avgScore * 100); // Convert to percentage
    } catch (error) {
      logger.error('Failed to get customer satisfaction score:', error);
      return 75; // Default fallback
    }
  }

  async getPeakHours(): Promise<PeakHourData[]> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get messages from last 24 hours
      const { data: messages, error } = await supabase
        .from('n8n_chat_histories')
        .select('created_at')
        .gte('created_at', oneDayAgo.toISOString());

      if (error) throw error;

      if (!messages || messages.length === 0) {
        // Return default hours if no data
        return Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          count: 0
        }));
      }

      // Group messages by hour
      const hourCounts = new Map<number, number>();
      
      messages.forEach(msg => {
        const hour = new Date(msg.created_at!).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      // Convert to array format
      const peakHours: PeakHourData[] = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: hourCounts.get(i) || 0
      }));

      return peakHours.sort((a, b) => b.count - a.count);
    } catch (error) {
      logger.error('Failed to get peak hours:', error);
      return [];
    }
  }

  async getResolutionRate(): Promise<number> {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get session sentiment summaries from last week
      const { data: sessions, error } = await supabase
        .from('session_sentiment_summary')
        .select('satisfaction_score, dominant_sentiment, conversation_quality')
        .gte('last_analyzed_at', oneWeekAgo.toISOString());

      if (error) throw error;

      if (!sessions || sessions.length === 0) return 70; // Default rate

      // Count resolved conversations
      // A conversation is considered resolved if:
      // 1. Satisfaction score > 0.6 OR
      // 2. Dominant sentiment is positive OR
      // 3. Conversation quality is 'good' or 'excellent'
      const resolvedSessions = sessions.filter(session => {
        return (
          (session.satisfaction_score && session.satisfaction_score > 0.6) ||
          session.dominant_sentiment === 'positive' ||
          ['good', 'excellent'].includes(session.conversation_quality || '')
        );
      });

      const resolutionRate = (resolvedSessions.length / sessions.length) * 100;
      return Math.round(resolutionRate);
    } catch (error) {
      logger.error('Failed to calculate resolution rate:', error);
      return 70; // Default fallback
    }
  }

  async getEnhancedAnalytics(): Promise<EnhancedAnalytics> {
    try {
      const [averageResponseTime, customerSatisfactionScore, peakHours, resolutionRate] = await Promise.all([
        this.getAverageResponseTime(),
        this.getCustomerSatisfactionScore(), 
        this.getPeakHours(),
        this.getResolutionRate()
      ]);

      return {
        averageResponseTime,
        customerSatisfactionScore,
        peakHours,
        resolutionRate
      };
    } catch (error) {
      logger.error('Failed to get enhanced analytics:', error);
      throw error;
    }
  }
}

export const enhancedAnalyticsService = new EnhancedAnalyticsService();
export default enhancedAnalyticsService; 
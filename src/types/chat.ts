import { SentimentAnalysis } from './sentiment';

export type MessagePlatform = 'whatsapp' | 'instagram' | 'facebook';

export interface ChatMessage {
  id: string;
  session_id: string;
  message: {
    content: string;
    type?: 'human' | 'ai';
    sender_name?: string;
    timestamp?: string;
    trigger?: MessagePlatform;
  };
  created_at: string;
  sentiment?: SentimentAnalysis;
  sentiment_loading?: boolean;
}

export interface ChatSession {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  sender_name?: string;
  unread_count?: number;
  sentiment_summary?: {
    overall_sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    average_confidence: number;
    total_analyzed: number;
    last_analysis_date?: string;
  };
}

export interface ChatAnalytics {
  session_id: string;
  total_messages: number;
  human_messages: number;
  ai_messages: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  average_response_time?: number;
  conversation_duration?: number;
  satisfaction_score?: number;
  escalation_flags?: string[];
}

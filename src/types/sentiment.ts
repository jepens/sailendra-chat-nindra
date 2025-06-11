export type SentimentType = 'positive' | 'negative' | 'neutral';

export type EmotionType = 
  | 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust' | 'trust' | 'anticipation';

export interface SentimentAnalysis {
  id: string;
  message_id: string;
  session_id: string;
  sentiment: SentimentType;
  confidence: number; // 0-1
  emotions?: {
    [key in EmotionType]?: number;
  };
  keywords?: string[];
  language?: string;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SentimentBatch {
  message_id: string;
  content: string;
  session_id: string;
}

export interface SentimentResult {
  sentiment: SentimentType;
  confidence: number;
  emotions?: {
    [key in EmotionType]?: number;
  };
  keywords?: string[];
  language?: string;
}

export interface SentimentStats {
  total_messages: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
  average_confidence: number;
  top_emotions: Array<{
    emotion: EmotionType;
    count: number;
    percentage: number;
  }>;
  sentiment_trend: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

export interface SentimentFilter {
  session_id?: string;
  sentiment?: SentimentType;
  date_from?: string;
  date_to?: string;
  min_confidence?: number;
  emotions?: EmotionType[];
  language?: string;
}

// Configuration for sentiment analysis service
export interface SentimentConfig {
  provider: 'local' | 'azure' | 'google' | 'aws';
  api_key?: string;
  endpoint?: string;
  model?: string;
  language: string;
  enable_emotions: boolean;
  enable_keywords: boolean;
  batch_size: number;
  auto_analyze: boolean;
  confidence_threshold: number;
}

// Real-time sentiment events
export interface SentimentEvent {
  type: 'sentiment_analyzed' | 'sentiment_updated' | 'batch_completed';
  data: {
    message_id?: string;
    session_id?: string;
    sentiment?: SentimentAnalysis;
    batch_id?: string;
    batch_size?: number;
    completed_count?: number;
  };
  timestamp: string;
} 
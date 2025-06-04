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
}

export interface ChatSession {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  sender_name?: string;
  unread_count?: number;
}

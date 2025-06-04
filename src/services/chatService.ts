import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatSession } from '@/types/chat';
import { getSetting } from './settingsService';
import { logger } from '@/utils/logger';

// Define a type that represents the expected message structure
type MessageObject = {
  content: string;
  type?: 'human' | 'ai';
  sender_name?: string;
  timestamp?: string;
  trigger?: 'whatsapp' | 'instagram' | 'facebook';
};

// Helper function to parse the message safely
const parseMessage = (message: any): MessageObject => {
  if (typeof message === 'string') {
    try {
      const parsed = JSON.parse(message) as MessageObject;
      // Validate and normalize message type
      if (parsed.type && parsed.type !== 'human' && parsed.type !== 'ai') {
        parsed.type = 'ai'; // Default to 'ai' for invalid types
        logger.warn('Invalid message type normalized:', { originalType: parsed.type });
      }
      // Validate trigger field
      if (parsed.trigger && !['whatsapp', 'instagram', 'facebook'].includes(parsed.trigger)) {
        logger.warn('Invalid trigger platform:', { trigger: parsed.trigger });
        delete parsed.trigger;
      }
      return parsed;
    } catch (e) {
      logger.warn('Failed to parse message as JSON:', { message });
      return { content: message, type: 'ai' };
    }
  }
  // Validate and normalize message type for object inputs
  if (message.type && message.type !== 'human' && message.type !== 'ai') {
    message.type = 'ai'; // Default to 'ai' for invalid types
    logger.warn('Invalid message type normalized:', { originalType: message.type });
  }
  // Validate trigger field for object inputs
  if (message.trigger && !['whatsapp', 'instagram', 'facebook'].includes(message.trigger)) {
    logger.warn('Invalid trigger platform:', { trigger: message.trigger });
    delete message.trigger;
  }
  return message as MessageObject;
};

// Session platform cache
const sessionPlatforms = new Map<string, 'whatsapp' | 'instagram' | 'facebook'>();

// Helper function to detect and store platform for a session
const detectAndStorePlatform = (sessionId: string, message: string): 'whatsapp' | 'instagram' | 'facebook' => {
  // First check if we already know this session's platform
  const existingPlatform = sessionPlatforms.get(sessionId);
  if (existingPlatform) {
    return existingPlatform;
  }

  // Check if message contains instagram session pattern
  if (message.toLowerCase().includes('instagram') || sessionId.length === 15) {
    sessionPlatforms.set(sessionId, 'instagram');
    return 'instagram';
  }

  // Check if message contains whatsapp pattern
  if (message.toLowerCase().includes('whatsapp') || sessionId.length === 12) {
    sessionPlatforms.set(sessionId, 'whatsapp');
    return 'whatsapp';
  }

  // Check for Facebook patterns
  // Facebook user IDs are typically longer (16-17 digits)
  if (
    message.toLowerCase().includes('facebook') || 
    /^\d{16,17}$/.test(sessionId) ||
    sessionId.startsWith('fb_') ||
    // Check for common Facebook message patterns
    message.toLowerCase().includes('messenger') ||
    // Facebook PSID format
    /^[0-9]{16}$/.test(sessionId)
  ) {
    sessionPlatforms.set(sessionId, 'facebook');
    logger.debug('Detected Facebook platform:', { sessionId, message });
    return 'facebook';
  }

  // For Instagram-like session IDs (numeric, 15 digits)
  if (/^\d{15}$/.test(sessionId)) {
    sessionPlatforms.set(sessionId, 'instagram');
    return 'instagram';
  }

  // If session ID starts with specific prefixes
  if (sessionId.startsWith('wa_')) {
    sessionPlatforms.set(sessionId, 'whatsapp');
    return 'whatsapp';
  }

  if (sessionId.startsWith('ig_')) {
    sessionPlatforms.set(sessionId, 'instagram');
    return 'instagram';
  }

  // Default to whatsapp if no platform detected
  logger.debug('No specific platform detected, defaulting to WhatsApp:', { sessionId, message });
  sessionPlatforms.set(sessionId, 'whatsapp');
  return 'whatsapp';
};

// Helper function to get platform for a session
const getSessionPlatform = (sessionId: string, message: string): 'whatsapp' | 'instagram' | 'facebook' => {
  return sessionPlatforms.get(sessionId) || detectAndStorePlatform(sessionId, message);
};

// Helper function to parse platform message
const parsePlatformMessage = (message: string): { 
  platform?: 'whatsapp' | 'instagram' | 'facebook',
  actualMessage: string,
  targetSessionId?: string
} => {
  const parts = message.split(' ');
  if (parts.length >= 2) {
    const platform = parts[0].toLowerCase();
    if (['whatsapp', 'instagram', 'facebook'].includes(platform)) {
      return {
        platform: platform as 'whatsapp' | 'instagram' | 'facebook',
        targetSessionId: parts[1],
        actualMessage: parts.slice(2).join(' ') || 'Hello' // Default message if no content
      };
    }
  }
  return { actualMessage: message };
};

export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('session_id, message, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by session_id and get the latest message for each session
    const sessions = data.reduce((acc: { [key: string]: ChatSession }, curr) => {
      const messageObj = typeof curr.message === 'string' ? JSON.parse(curr.message) : curr.message;
      
      if (!acc[curr.session_id] || new Date(curr.created_at) > new Date(acc[curr.session_id].last_timestamp)) {
        // Detect and store platform for this session
        const platform = getSessionPlatform(curr.session_id, messageObj.content || '');
        
        acc[curr.session_id] = {
          session_id: curr.session_id,
          last_message: messageObj.content || '',
          last_timestamp: curr.created_at,
          sender_name: messageObj.sender_name,
          unread_count: 0
        };
      }
      return acc;
    }, {});

    return Object.values(sessions);
  } catch (error) {
    logger.error('Failed to fetch chat sessions:', error as Error);
    throw error;
  }
};

export const fetchChatMessages = async (
  sessionId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> => {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // First get total count
    const { count } = await supabase
      .from('n8n_chat_histories')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Then fetch paginated data
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }) // Changed to descending for better pagination
      .range(offset, offset + limit - 1);

    if (error) throw error;

    logger.debug('Fetched chat messages:', { 
      sessionId, 
      count: data?.length || 0,
      page,
      limit 
    });

    const messages = data.map(item => {
      // Parse message using our helper
      const messageObj = parseMessage(item.message);
      
      return {
        id: item.id.toString(),
        session_id: item.session_id,
        message: {
          content: messageObj.content || '',
          type: messageObj.type || 'human',
          sender_name: messageObj.sender_name,
          timestamp: messageObj.timestamp || item.created_at,
          trigger: messageObj.trigger
        },
        created_at: item.created_at || new Date().toISOString(),
      };
    });

    // Check if there are more messages to load
    const hasMore = count ? offset + limit < count : false;

    return {
      messages: messages.reverse(), // Reverse to maintain chronological order
      hasMore
    };
  } catch (error) {
    logger.error('Failed to fetch chat messages:', error as Error);
    throw error;
  }
};

export const sendMessage = async (sessionId: string, message: string, trigger?: 'whatsapp' | 'instagram' | 'facebook'): Promise<ChatMessage> => {
  try {
    // Determine the platform
    const platform = trigger || getSessionPlatform(sessionId, message);
    
    logger.debug('Platform detection result:', { 
      sessionId, 
      detectedPlatform: platform,
      trigger,
      messagePreview: message.substring(0, 100)
    });

    // Create the message object that will be consistent throughout
    const messageContent = {
      content: message,
      type: 'ai' as const,
      timestamp: new Date().toISOString(),
      trigger: platform
    };

    // First, add the message to Supabase
    const newMessage = {
      session_id: sessionId,
      message: messageContent
    };

    logger.debug('Sending message:', { 
      sessionId,
      messageContent,
      platform,
      originalMessage: message
    });

    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .insert(newMessage)
      .select()
      .single();

    if (error) throw error;

    // Then, send to webhook if configured
    try {
      const webhookUrl = await getSetting('webhook_url');
      
      if (webhookUrl) {
        const webhookPayload = {
          session_id: sessionId,
          message: messageContent,
          timestamp: messageContent.timestamp
        };
        
        logger.debug('Sending webhook payload:', webhookPayload);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          logger.error(`Webhook request failed with status ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      logger.error('Failed to send message to webhook:', error as Error);
    }

    return {
      id: data.id.toString(),
      session_id: sessionId,
      message: messageContent,
      created_at: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to send message:', error as Error);
    throw error;
  }
};

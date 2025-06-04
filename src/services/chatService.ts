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
};

// Helper function to parse the message safely
const parseMessage = (message: any): MessageObject => {
  if (typeof message === 'string') {
    try {
      const parsed = JSON.parse(message);
      // Convert 'agent' type to 'ai'
      if (parsed.type === 'agent') {
        parsed.type = 'ai';
      }
      return parsed as MessageObject;
    } catch (e) {
      logger.warn('Failed to parse message as JSON:', { message });
      return { content: message, type: 'ai' };
    }
  }
  
  // Handle case where message is already an object
  if (message.type === 'agent') {
    message.type = 'ai';
  }
  
  // Ensure type is either 'human' or 'ai'
  if (message.type !== 'human' && message.type !== 'ai') {
    message.type = 'ai'; // Default to 'ai' for unknown types
  }
  
  return message as MessageObject;
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
      const messageObj = parseMessage(curr.message);
      
      if (!acc[curr.session_id] || new Date(curr.created_at) > new Date(acc[curr.session_id].last_timestamp)) {
        acc[curr.session_id] = {
          session_id: curr.session_id,
          last_message: messageObj.content,
          last_timestamp: curr.created_at,
          sender_name: messageObj.sender_name,
          unread_count: 0 // You might want to implement unread count logic
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

export const fetchChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    logger.debug('Fetched chat messages:', { 
      sessionId, 
      count: data?.length || 0 
    });

    return data.map(item => {
      // Parse message using our helper
      const messageObj = parseMessage(item.message);
      
      return {
        id: item.id,
        session_id: item.session_id,
        message: {
          content: messageObj.content || '',
          type: messageObj.type || 'human',
          sender_name: messageObj.sender_name,
          timestamp: messageObj.timestamp || item.created_at,
        },
        created_at: item.created_at || new Date().toISOString(),
      };
    });
  } catch (error) {
    logger.error('Failed to fetch chat messages:', error as Error);
    throw error;
  }
};

export const sendMessage = async (sessionId: string, message: string): Promise<ChatMessage> => {
  try {
    // First, add the message to Supabase
    const messageObject: MessageObject = {
      content: message,
      type: 'ai',
      timestamp: new Date().toISOString()
    };

    const newMessage = {
      session_id: sessionId,
      message: messageObject
    };

    logger.debug('Sending message:', { 
      sessionId,
      messageLength: message.length 
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
        const timestamp = new Date().toISOString();
        
        const webhookPayload = {
          session_id: sessionId,
          message: messageObject,
          timestamp: timestamp
        };
        
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        }).catch(err => {
          logger.error('Failed to send message to webhook:', err as Error);
        });
      }
    } catch (error) {
      logger.error('Failed to send message to webhook:', error as Error);
    }

    // Parse the returned message
    const messageObj = parseMessage(data.message);

    return {
      id: data.id,
      session_id: data.session_id,
      message: {
        content: messageObj.content || '',
        type: 'ai',
        timestamp: messageObj.timestamp || data.created_at,
      },
      created_at: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to send message:', error as Error);
    throw error;
  }
};

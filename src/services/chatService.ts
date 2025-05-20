
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatSession } from '@/types/chat';

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
      return JSON.parse(message) as MessageObject;
    } catch (e) {
      return { content: message, type: 'human' };
    }
  }
  
  return message as MessageObject;
};

export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('n8n_chat_histories')
    .select('session_id, message, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by session_id and get the last message for each session
  const sessionMap = new Map<string, ChatSession>();

  data?.forEach((item) => {
    const session_id = item.session_id;
    const currentTimestamp = new Date(item.created_at || '').getTime();
    
    if (!sessionMap.has(session_id) || 
        new Date(sessionMap.get(session_id)!.last_timestamp).getTime() < currentTimestamp) {
      
      // Parse message using our helper
      const messageObj = parseMessage(item.message);
      const content = messageObj.content || '';
      
      // Extract content after the first two lines (if present)
      const lines = content.split('\n');
      const messageContent = lines.length > 2 ? lines.slice(2).join('\n') : content;
      
      sessionMap.set(session_id, {
        session_id,
        last_message: messageContent,
        last_timestamp: item.created_at || new Date().toISOString(),
        sender_name: messageObj.sender_name,
      });
    }
  });

  return Array.from(sessionMap.values());
};

export const fetchChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('n8n_chat_histories')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

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
};

export const sendMessage = async (sessionId: string, message: string): Promise<ChatMessage> => {
  // First, add the message to Supabase
  const messageObject: MessageObject = {
    content: message,
    type: 'human' as const,
  };

  const newMessage = {
    session_id: sessionId,
    message: messageObject
  };

  const { data, error } = await supabase
    .from('n8n_chat_histories')
    .insert(newMessage)
    .select()
    .single();

  if (error) throw error;

  // Then, send to webhook (this will happen asynchronously)
  try {
    fetch('https://yourdomain.com/webhook/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
      }),
    });
  } catch (error: any) {
    console.error('Failed to send message to webhook:', error);
  }

  // Parse the returned message
  const messageObj = parseMessage(data.message);

  return {
    id: data.id,
    session_id: data.session_id,
    message: {
      content: messageObj.content || '',
      type: messageObj.type || 'human',
      sender_name: messageObj.sender_name,
      timestamp: messageObj.timestamp || data.created_at,
    },
    created_at: data.created_at || new Date().toISOString(),
  };
};

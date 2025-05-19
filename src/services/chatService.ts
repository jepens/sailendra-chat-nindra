
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatSession } from '@/types/chat';

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
      
      const content = item.message.content || '';
      // Extract content after the first two lines (if present)
      const lines = content.split('\n');
      const messageContent = lines.length > 2 ? lines.slice(2).join('\n') : content;
      
      sessionMap.set(session_id, {
        session_id,
        last_message: messageContent,
        last_timestamp: item.created_at || new Date().toISOString(),
        sender_name: item.message.sender_name,
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

  return data as ChatMessage[];
};

export const sendMessage = async (sessionId: string, message: string): Promise<ChatMessage> => {
  // First, add the message to Supabase
  const newMessage = {
    session_id: sessionId,
    message: {
      content: message,
      type: 'human' as const,
    }
  };

  const { data, error } = await supabase
    .from('n8n_chat_histories')
    .insert(newMessage)
    .select()
    .single();

  if (error) throw error;

  // Then, send to webhook (this will happen asynchronously)
  try {
    fetch('https://your-n8n-url.com/webhook/send-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message,
      }),
    });
  } catch (error) {
    console.error('Failed to send message to webhook:', error);
  }

  return data as ChatMessage;
};

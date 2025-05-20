
import { supabase } from '@/integrations/supabase/client';

export interface LogEntry {
  id: string;
  waId?: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  messageType: string;
  direction: "incoming" | "outgoing";
  timestamp: string;
  status: string;
}

export const fetchLogs = async (
  dateFrom?: string,
  dateTo?: string,
  phoneNumber?: string,
  direction?: string
): Promise<LogEntry[]> => {
  let query = supabase
    .from('n8n_chat_histories')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters if provided
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    // Add time to include the entire day
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endDate.toISOString());
  }

  if (phoneNumber) {
    // We'll need to search within the message JSON for phone numbers
    // This is a simplified approach as the real implementation would depend on your data structure
    query = query.ilike('session_id', `%${phoneNumber}%`);
  }

  if (direction && direction !== 'all') {
    // For direction filtering, we'll need to check the message.type
    // This assumes message type is stored in the JSON data
    // A more sophisticated approach would be needed if the structure is different
    query = query.eq('message->>type', direction);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }

  // Transform the data to match the LogEntry interface
  return data.map(item => {
    // Parse message object from JSON if needed
    let messageObj: any = item.message;
    if (typeof messageObj === 'string') {
      try {
        messageObj = JSON.parse(messageObj);
      } catch (e) {
        messageObj = { content: messageObj };
      }
    }

    // Determine direction based on message type
    const direction = messageObj.type === 'human' ? 'outgoing' : 'incoming';
    
    // Use session_id as the phone number if no better option exists
    const phoneNumber = item.session_id;
    
    return {
      id: item.id.toString(),
      waId: phoneNumber,
      fromNumber: direction === 'incoming' ? phoneNumber : 'whatsapp',
      toNumber: direction === 'outgoing' ? phoneNumber : 'whatsapp',
      message: messageObj.content || '',
      messageType: 'text',
      direction,
      timestamp: item.created_at,
      status: 'sent'
    };
  });
};

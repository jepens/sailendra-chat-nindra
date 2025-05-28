import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LogEntry {
  id: string;
  waId?: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  messageType: string;
  direction: "incoming" | "outgoing";
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed";
  sender_name?: string;
}

export type MessageDirection = "incoming" | "outgoing" | "all";

export const fetchLogs = async (
  dateFrom?: string,
  dateTo?: string,
  phoneNumber?: string,
  direction?: MessageDirection
): Promise<LogEntry[]> => {
  try {
    let query = supabase
      .from('n8n_chat_histories')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply date filters
    if (dateFrom) {
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startDate.toISOString());
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    if (phoneNumber) {
      query = query.ilike('session_id', `%${phoneNumber}%`);
    }

    logger.debug('Fetching logs with filters:', {
      dateFrom,
      dateTo,
      phoneNumber,
      direction
    });

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching logs:', error);
      throw error;
    }

    logger.info('Successfully fetched logs:', {
      count: data?.length || 0
    });

    // Transform the data to match the LogEntry interface
    return data.map(item => {
      // Parse message object from JSON if needed
      let messageObj: any = item.message;
      if (typeof messageObj === 'string') {
        try {
          messageObj = JSON.parse(messageObj);
        } catch (e) {
          logger.warn('Failed to parse message JSON:', {
            messageId: item.id,
            error: e
          });
          messageObj = { content: messageObj };
        }
      }

      // Determine direction and type based on message type
      let messageDirection: "incoming" | "outgoing";
      let status: "sent" | "delivered" | "read" | "failed" = "sent";

      switch (messageObj.type) {
        case 'human':
          messageDirection = 'incoming';
          status = 'read';
          break;
        case 'ai':
          messageDirection = 'outgoing';
          status = 'delivered';
          break;
        default:
          messageDirection = 'incoming';
          status = 'read';
      }

      // Filter by direction if specified
      if (direction && direction !== 'all' && messageDirection !== direction) {
        return null;
      }
      
      return {
        id: item.id.toString(),
        waId: item.session_id,
        fromNumber: messageDirection === 'incoming' ? item.session_id : 'AI',
        toNumber: messageDirection === 'outgoing' ? item.session_id : 'AI',
        message: messageObj.content || '',
        messageType: messageObj.type || 'text',
        direction: messageDirection,
        timestamp: item.created_at,
        status,
        sender_name: messageObj.sender_name
      };
    }).filter(Boolean) as LogEntry[];
  } catch (error) {
    logger.error('Failed to fetch logs:', error as Error);
    throw error;
  }
};

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface RecentConversation {
  session_id: string;
  contact_identifier: string; // phone number or name
  last_message: string;
  last_message_time: string;
  new_messages_count: number;
  last_activity: string; // formatted time like "3 hours ago"
}

class RecentConversationsService {
  
  async getRecentConversations(limit: number = 10): Promise<RecentConversation[]> {
    try {
      // Get recent chat sessions with their latest messages
      const { data: recentMessages, error } = await supabase
        .from('n8n_chat_histories')
        .select('session_id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(100); // Get more to properly group by session

      if (error) throw error;

      if (!recentMessages || recentMessages.length === 0) {
        return [];
      }

      // Group messages by session_id and get the latest message for each
      const sessionMap = new Map<string, any>();
      
      recentMessages.forEach(msg => {
        if (!sessionMap.has(msg.session_id) || 
            new Date(msg.created_at) > new Date(sessionMap.get(msg.session_id).created_at)) {
          sessionMap.set(msg.session_id, msg);
        }
      });

      // Convert to array and sort by latest activity
      const latestSessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      // Process each session to create RecentConversation objects
      const conversations: RecentConversation[] = await Promise.all(
        latestSessions.map(async (session) => {
          const messageObj = typeof session.message === 'string' 
            ? JSON.parse(session.message) 
            : session.message;

          // Count new messages (messages from last 24 hours for this session)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const { count: newMessagesCount } = await supabase
            .from('n8n_chat_histories')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.session_id)
            .gte('created_at', twentyFourHoursAgo.toISOString());

          // Extract contact identifier (phone number or name)
          let contactIdentifier = session.session_id;
          if (messageObj.sender_name) {
            contactIdentifier = messageObj.sender_name;
          } else if (messageObj.content) {
            // Try to extract phone number from WhatsApp message format
            const lines = messageObj.content.split('\n');
            if (lines.length >= 2 && lines[0].toLowerCase() === 'whatsapp') {
              contactIdentifier = lines[1];
            }
          }

          // Format last activity time
          const lastActivity = this.formatTimeAgo(new Date(session.created_at));

          return {
            session_id: session.session_id,
            contact_identifier: contactIdentifier,
            last_message: messageObj.content || 'No message content',
            last_message_time: session.created_at,
            new_messages_count: newMessagesCount || 0,
            last_activity: lastActivity
          };
        })
      );

      return conversations;
    } catch (error) {
      logger.error('Failed to fetch recent conversations:', error);
      throw error;
    }
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private extractPhoneNumber(content: string): string {
    // Try to extract phone number from WhatsApp message format
    const lines = content.split('\n');
    if (lines.length >= 2 && lines[0].toLowerCase() === 'whatsapp') {
      return lines[1];
    }
    
    // Try to extract phone number using regex
    const phoneRegex = /(\+?62|0)[0-9]{9,12}/;
    const match = content.match(phoneRegex);
    return match ? match[0] : content;
  }

  private formatPhoneNumber(phone: string): string {
    // Clean up phone number format
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('62')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+62${cleaned.slice(1)}`;
    }
    
    return phone;
  }
}

export const recentConversationsService = new RecentConversationsService();
export default recentConversationsService; 
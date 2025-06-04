import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface DashboardStats {
  totalConversations: number;
  activeToday: number;
  messagesReceived: number;
  responseRate: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total conversations (unique session_ids)
    const { data: totalData, error: totalError } = await supabase
      .from('n8n_chat_histories')
      .select('session_id')
      .not('session_id', 'is', null);

    if (totalError) throw totalError;

    const uniqueSessions = new Set(totalData.map(item => item.session_id));

    // Get active conversations today
    const { data: activeData, error: activeError } = await supabase
      .from('n8n_chat_histories')
      .select('session_id')
      .gte('created_at', startOfToday.toISOString());

    if (activeError) throw activeError;

    const uniqueActiveToday = new Set(activeData.map(item => item.session_id));

    // Get total messages received in last week
    const { data: messagesData, error: messagesError } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .gte('created_at', startOfLastWeek.toISOString());

    if (messagesError) throw messagesError;

    // Calculate response rate (messages with type 'ai' vs total)
    const totalMessages = messagesData.length;
    const aiResponses = messagesData.filter(msg => {
      const message = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
      return message.type === 'ai';
    }).length;

    const responseRate = totalMessages > 0 ? (aiResponses / totalMessages) * 100 : 0;

    return {
      totalConversations: uniqueSessions.size,
      activeToday: uniqueActiveToday.size,
      messagesReceived: totalMessages,
      responseRate: Math.round(responseRate)
    };
  } catch (error) {
    logger.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
};

// Function to get stats comparison with last week
export const getStatsComparison = async (): Promise<{
  conversations: number;
  active: number;
  messages: number;
  response: number;
}> => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get data for this week
    const { data: thisWeekData } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .gte('created_at', oneWeekAgo.toISOString());

    // Get data for last week
    const { data: lastWeekData } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString());

    // Calculate comparisons
    const thisWeekStats = calculateWeeklyStats(thisWeekData || []);
    const lastWeekStats = calculateWeeklyStats(lastWeekData || []);

    return {
      conversations: calculatePercentageChange(lastWeekStats.conversations, thisWeekStats.conversations),
      active: calculatePercentageChange(lastWeekStats.active, thisWeekStats.active),
      messages: calculatePercentageChange(lastWeekStats.messages, thisWeekStats.messages),
      response: calculatePercentageChange(lastWeekStats.responseRate, thisWeekStats.responseRate)
    };
  } catch (error) {
    logger.error('Failed to fetch stats comparison:', error);
    throw error;
  }
};

function calculateWeeklyStats(data: any[]) {
  const uniqueSessions = new Set(data.map(item => item.session_id)).size;
  const totalMessages = data.length;
  const aiResponses = data.filter(msg => {
    const message = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
    return message.type === 'ai';
  }).length;

  return {
    conversations: uniqueSessions,
    active: uniqueSessions,
    messages: totalMessages,
    responseRate: totalMessages > 0 ? (aiResponses / totalMessages) * 100 : 0
  };
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
} 
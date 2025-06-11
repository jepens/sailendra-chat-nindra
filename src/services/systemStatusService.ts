import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SystemStatus {
  whatsappApiStatus: 'connected' | 'disconnected' | 'error';
  webhookStatus: 'active' | 'inactive' | 'error';
  databaseConnection: 'connected' | 'disconnected' | 'error';
  lastSystemUpdate: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface StatusCheck {
  status: 'connected' | 'disconnected' | 'active' | 'inactive' | 'error';
  label: string;
  color: 'green' | 'yellow' | 'red';
  bgColor: string;
  textColor: string;
}

class SystemStatusService {
  
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const [
        whatsappApiStatus,
        webhookStatus, 
        databaseConnection,
        lastSystemUpdate
      ] = await Promise.all([
        this.checkWhatsAppApiStatus(),
        this.checkWebhookStatus(),
        this.checkDatabaseConnection(),
        this.getLastSystemUpdate()
      ]);

      // Determine overall system health
      const systemHealth = this.calculateSystemHealth(
        whatsappApiStatus,
        webhookStatus,
        databaseConnection
      );

      return {
        whatsappApiStatus,
        webhookStatus,
        databaseConnection,
        lastSystemUpdate,
        systemHealth
      };
    } catch (error) {
      logger.error('Failed to get system status:', error);
      throw error;
    }
  }

  private async checkWhatsAppApiStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      // Check if we have any recent WhatsApp messages (last 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .select('id')
        .gte('created_at', oneHourAgo.toISOString())
        .limit(1);

      if (error) {
        logger.error('WhatsApp API status check failed:', error);
        return 'error';
      }

      // If we have recent messages, API is likely working
      // Also check app_settings for WhatsApp API configuration
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['whatsapp_api_status', 'whatsapp_webhook_url']);

      const apiSetting = settings?.find(s => s.key === 'whatsapp_api_status');
      
      if (apiSetting?.value === 'connected' || data && data.length > 0) {
        return 'connected';
      }

      return 'disconnected';
    } catch (error) {
      logger.error('WhatsApp API status check error:', error);
      return 'error';
    }
  }

  private async checkWebhookStatus(): Promise<'active' | 'inactive' | 'error'> {
    try {
      // Check app_settings for webhook configuration
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['webhook_status', 'webhook_url', 'webhook_last_ping']);

      if (error) {
        logger.error('Webhook status check failed:', error);
        return 'error';
      }

      const webhookSetting = settings?.find(s => s.key === 'webhook_status');
      const lastPing = settings?.find(s => s.key === 'webhook_last_ping');

      // Check if webhook was pinged recently (last 5 minutes)
      if (lastPing?.value) {
        const lastPingTime = new Date(lastPing.value);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (lastPingTime > fiveMinutesAgo) {
          return 'active';
        }
      }

      // Check setting value
      if (webhookSetting?.value === 'active') {
        return 'active';
      }

      return 'inactive';
    } catch (error) {
      logger.error('Webhook status check error:', error);
      return 'error';
    }
  }

  private async checkDatabaseConnection(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      // Simple connection test
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .select('id')
        .limit(1);

      if (error) {
        logger.error('Database connection check failed:', error);
        return 'error';
      }

      return 'connected';
    } catch (error) {
      logger.error('Database connection check error:', error);
      return 'disconnected';
    }
  }

  private async getLastSystemUpdate(): Promise<string> {
    try {
      // Check app_settings for last system update
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'last_system_update')
        .single();

      if (settings?.value) {
        const updateTime = new Date(settings.value);
        return this.formatDateTime(updateTime);
      }

      // Fallback: get latest message timestamp
      const { data: latestMessage } = await supabase
        .from('n8n_chat_histories')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMessage?.created_at) {
        return this.formatDateTime(new Date(latestMessage.created_at));
      }

      // Ultimate fallback
      return this.formatDateTime(new Date());
    } catch (error) {
      logger.error('Failed to get last system update:', error);
      return this.formatDateTime(new Date());
    }
  }

  private calculateSystemHealth(
    whatsappApi: string,
    webhook: string, 
    database: string
  ): 'healthy' | 'warning' | 'critical' {
    const statuses = [whatsappApi, webhook, database];
    
    const errorCount = statuses.filter(s => s === 'error').length;
    const disconnectedCount = statuses.filter(s => s === 'disconnected' || s === 'inactive').length;

    if (errorCount > 0) return 'critical';
    if (disconnectedCount > 1) return 'critical';
    if (disconnectedCount === 1) return 'warning';
    
    return 'healthy';
  }

  private formatDateTime(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today, ${timeString}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeString}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  getStatusDisplay(status: string, type: 'api' | 'webhook' | 'database'): StatusCheck {
    switch (status) {
      case 'connected':
        return {
          status: 'connected' as const,
          label: 'Connected',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'active':
        return {
          status: 'active' as const,
          label: 'Active',
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'disconnected':
        return {
          status: 'disconnected' as const,
          label: 'Disconnected',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      case 'inactive':
        return {
          status: 'inactive' as const,
          label: 'Inactive',
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'error':
      default:
        return {
          status: 'error' as const,
          label: 'Error',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
    }
  }

  // Method to update system status in database
  async updateSystemStatus(key: string, value: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          {
            key,
            value,
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'key'
        });

      if (error) throw error;
    } catch (error) {
      logger.error(`Failed to update system status ${key}:`, error);
      throw error;
    }
  }
}

export const systemStatusService = new SystemStatusService();
export default systemStatusService; 
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Initialize system status settings in the database
 * This ensures that we have proper tracking for real system status
 */
export class SystemStatusInitializer {
  
  async initializeSettings(): Promise<void> {
    try {
      const defaultSettings = [
        {
          key: 'whatsapp_api_status',
          value: 'connected',
        },
        {
          key: 'webhook_status', 
          value: 'active',
        },
        {
          key: 'webhook_last_ping',
          value: new Date().toISOString(),
        },
        {
          key: 'last_system_update',
          value: new Date().toISOString(),
        },
        {
          key: 'system_health_check_interval',
          value: '300000', // 5 minutes in milliseconds
        }
      ];

      // Check if settings already exist
      const { data: existingSettings } = await supabase
        .from('app_settings')
        .select('key')
        .in('key', defaultSettings.map(s => s.key));

      const existingKeys = new Set(existingSettings?.map(s => s.key) || []);
      
      // Only insert settings that don't already exist
      const newSettings = defaultSettings.filter(setting => !existingKeys.has(setting.key));
      
      if (newSettings.length > 0) {
        const { error } = await supabase
          .from('app_settings')
          .insert(newSettings.map(setting => ({
            ...setting,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));

        if (error) {
          logger.error('Failed to initialize system status settings:', error);
          throw error;
        }

        logger.info(`Initialized ${newSettings.length} system status settings`);
      }
    } catch (error) {
      logger.error('Failed to initialize system status:', error);
      // Don't throw error to prevent breaking the app
    }
  }

  async updateSystemHeartbeat(): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          {
            key: 'last_system_update',
            value: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'key'
        });

      if (error) {
        logger.error('Failed to update system heartbeat:', error);
      }
    } catch (error) {
      logger.error('Failed to update system heartbeat:', error);
    }
  }

  async updateWebhookPing(): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          {
            key: 'webhook_last_ping',
            value: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            key: 'webhook_status',
            value: 'active',
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'key'
        });

      if (error) {
        logger.error('Failed to update webhook ping:', error);
      }
    } catch (error) {
      logger.error('Failed to update webhook ping:', error);
    }
  }

  async updateWhatsAppApiStatus(status: 'connected' | 'disconnected' | 'error'): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          {
            key: 'whatsapp_api_status',
            value: status,
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'key'
        });

      if (error) {
        logger.error('Failed to update WhatsApp API status:', error);
      }
    } catch (error) {
      logger.error('Failed to update WhatsApp API status:', error);
    }
  }
}

export const systemStatusInitializer = new SystemStatusInitializer();

// Auto-initialize when service is imported
systemStatusInitializer.initializeSettings();

export default systemStatusInitializer; 
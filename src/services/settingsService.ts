import { supabase } from '@/integrations/supabase/client';

export const SETTINGS_KEYS = {
  WEBHOOK_URL: 'webhook_url'
} as const;

export type AppSetting = {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

/**
 * Fetches a setting by key from the app_settings table
 */
export const getSetting = async (key: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error('Error fetching setting:', error);
    return null;
  }
  
  return data?.value || null;
};

/**
 * Updates a setting in the app_settings table
 */
export const updateSetting = async (key: string, value: string): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .update({ 
      value,
      updated_at: new Date().toISOString()
    })
    .eq('key', key);
  
  if (error) {
    console.error('Error updating setting:', error);
    return false;
  }
  
  return true;
};

/**
 * Tests a webhook URL by sending a test payload
 */
export const testWebhook = async (url: string): Promise<{ success: boolean; message: string }> => {
  try {
    const timestamp = new Date().toISOString();
    
    // Create message object matching the format in chatService
    const messageObject = {
      content: "This is a test message from the WhatsApp chatbot system",
      type: "ai" as const,
    };
    
    // Create test payload based on the format used in chatService.ts
    const testPayload = {
      session_id: "6281234567890",
      message: messageObject,
      timestamp: timestamp
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    if (!response.ok) {
      return { 
        success: false, 
        message: `Failed to send test: Server responded with ${response.status} ${response.statusText}` 
      };
    }
    
    return { success: true, message: 'Webhook test successful!' };
  } catch (error) {
    console.error('Error testing webhook:', error);
    return { 
      success: false, 
      message: `Error testing webhook: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

// Add alias export for backward compatibility
export const setSetting = updateSetting;

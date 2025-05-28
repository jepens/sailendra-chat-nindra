import { supabase } from '@/integrations/supabase/client';

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error('Failed to get setting:', error);
    return null;
  }
};

export const setSetting = async (key: string, value: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to set setting:', error);
    return false;
  }
};

/**
 * Tests a webhook URL by sending a test payload
 */
export const testWebhook = async (url: string): Promise<{ success: boolean; message: string }> => {
  try {
    const timestamp = new Date().toISOString();
    
    const messageObject = {
      content: "This is a test message from the AI chatbot system",
      type: "ai" as const,
    };
    
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

import { ContactRecord, ContactsResponse } from '@/types/contact';
import { getSetting } from './settingsService';

export const contactService = {
  async getContacts(): Promise<ContactRecord[]> {
    try {
      const webhookUrl = await getSetting('webhook_url');
      
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(webhookUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const data: ContactsResponse = await response.json();
      console.log('Fetched contacts:', data); // Debug log
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }
}; 
import { useState, useEffect } from 'react';
import { ContactRecord } from '@/types/contact';
import { contactService } from '@/services/contactService';

export function useContacts() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await contactService.getContacts();
      console.log('Fetched contacts:', data); // Debug log
      
      // Validate that data is an array
      if (Array.isArray(data)) {
        setContacts(data);
        setError(null);
      } else {
        console.error('Invalid contacts data format:', data);
        setError('Invalid contacts data format');
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizePhoneNumber = (phone: string): string => {
    // Check if phone is null, undefined, or empty
    if (!phone || typeof phone !== 'string') {
      return '';
    }
    
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If the number starts with '62', keep it as is
    // If it starts with '0', replace '0' with '62'
    // Otherwise, assume it's a local number and add '62'
    if (digits.startsWith('62')) {
      return digits;
    } else if (digits.startsWith('0')) {
      return '62' + digits.slice(1);
    } else {
      return '62' + digits;
    }
  };

  const getContactName = (phoneNumber: string): string | null => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return null;

    // Check if contacts array is valid
    if (!Array.isArray(contacts)) return null;

    // Normalize the search number
    const normalizedSearchNumber = normalizePhoneNumber(phoneNumber);
    if (!normalizedSearchNumber) return null;
    
    console.log('Looking for contact:', { original: phoneNumber, normalized: normalizedSearchNumber }); // Debug log
    
    const contact = contacts.find(contact => {
      // Validate contact structure
      if (!contact || !contact.fields || !contact.fields.Phone) return false;
      
      const normalizedContactNumber = normalizePhoneNumber(contact.fields.Phone);
      const match = normalizedContactNumber === normalizedSearchNumber;
      console.log('Comparing:', { 
        contact: contact.fields["Name and Org"],
        contactNumber: contact.fields.Phone,
        normalized: normalizedContactNumber,
        matches: match
      }); // Debug log
      return match;
    });

    return contact ? contact.fields["Name and Org"] : null;
  };

  return {
    contacts,
    loading,
    error,
    getContactName,
    refreshContacts: fetchContacts
  };
} 
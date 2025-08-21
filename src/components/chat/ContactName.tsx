import { useContactsContext } from '@/contexts/ContactsContext';

interface ContactNameProps {
  phoneNumber: string;
  className?: string;
}

export function ContactName({ phoneNumber, className = '' }: ContactNameProps) {
  try {
    const { getContactName } = useContactsContext();
    
    // Safety check for phoneNumber
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.warn('ContactName: Invalid phoneNumber provided:', phoneNumber);
      return (
        <span className={className}>
          Unknown Contact
        </span>
      );
    }
    
    const contactName = getContactName(phoneNumber);

    // Add debug logging
    console.log('ContactName component:', { phoneNumber, contactName });

    return (
      <span className={className}>
        {contactName || phoneNumber}
      </span>
    );
  } catch (error) {
    console.error('ContactName component error:', error);
    return (
      <span className={className}>
        Error Loading Contact
      </span>
    );
  }
} 
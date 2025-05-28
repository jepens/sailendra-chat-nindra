import { useContactsContext } from '@/contexts/ContactsContext';

interface ContactNameProps {
  phoneNumber: string;
  className?: string;
}

export function ContactName({ phoneNumber, className = '' }: ContactNameProps) {
  const { getContactName } = useContactsContext();
  const contactName = getContactName(phoneNumber);

  // Add debug logging
  console.log('ContactName component:', { phoneNumber, contactName });

  return (
    <span className={className}>
      {contactName || phoneNumber}
    </span>
  );
} 
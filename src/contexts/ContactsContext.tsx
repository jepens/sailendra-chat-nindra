import { createContext, useContext, ReactNode } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { ContactRecord } from '@/types/contact';

interface ContactsContextType {
  contacts: ContactRecord[];
  loading: boolean;
  error: string | null;
  getContactName: (phoneNumber: string) => string | null;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const contactsData = useContacts();

  return (
    <ContactsContext.Provider value={contactsData}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContactsContext() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContactsContext must be used within a ContactsProvider');
  }
  return context;
} 
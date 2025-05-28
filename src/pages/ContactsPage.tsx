import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useContactsContext } from '@/contexts/ContactsContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Star, Mail, Phone } from 'lucide-react';

const ContactsPage = () => {
  const { contacts, loading, error, refreshContacts } = useContactsContext();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredContacts = React.useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    
    const searchLower = searchTerm.toLowerCase();
    return contacts.filter(contact => 
      contact.fields["Name and Org"].toLowerCase().includes(searchLower) ||
      contact.fields.Phone.includes(searchTerm) ||
      (contact.fields.Email?.toLowerCase().includes(searchLower))
    );
  }, [contacts, searchTerm]);

  if (error) {
    return (
      <DashboardLayout title="Contacts">
        <div className="p-4">
          <Card className="p-6 bg-destructive/10 text-destructive">
            <p>Error loading contacts: {error}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => refreshContacts()}
            >
              Retry
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contacts">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => refreshContacts()}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {contact.fields["Name and Org"]}
                      {contact.fields.VIP && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h3>
                    {contact.fields.Email && (
                      <a 
                        href={`mailto:${contact.fields.Email}`}
                        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.fields.Email}
                      </a>
                    )}
                    <a 
                      href={`tel:${contact.fields.Phone}`}
                      className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
                      {contact.fields.Phone}
                    </a>
                  </div>
                </div>
                {contact.fields["Interested in"] && (
                  <Badge variant="secondary" className="mt-2">
                    {contact.fields["Interested in"]}
                  </Badge>
                )}
                {contact.fields.Budget && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Budget: {contact.fields.Budget}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredContacts.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            {searchTerm ? 'No contacts found matching your search.' : 'No contacts available.'}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContactsPage; 
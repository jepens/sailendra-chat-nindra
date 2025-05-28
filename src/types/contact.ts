export interface ContactFields {
  "Name and Org": string;
  Email?: string;
  Phone: string;
  Opportunities?: string[];
  Name: string;
  VIP?: boolean;
  id: string;
  "Interested in"?: string;
  Budget?: string;
}

export interface ContactRecord {
  id: string;
  createdTime: string;
  fields: ContactFields;
}

export type ContactsResponse = ContactRecord[]; 
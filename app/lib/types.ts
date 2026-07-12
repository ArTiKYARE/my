export interface Project {
  id: string;
  title: string;
  description: string;
  logo: string;
  banner: string;
  tags: string[];
  link?: string;
  github?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover?: string;
  tags: string[];
  publishedAt: string;
}

export interface Contacts {
  email?: string;
  phone?: string;
  telegram?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export type LeadStatus = "new" | "in-progress" | "done" | "archived";

export interface Lead {
  id: string;
  name: string;
  contact: string;
  description: string;
  status: LeadStatus;
  createdAt: string;
}

export interface Profile {
  name: string;
  role: string;
  photo: string;
  bio: string;
  skills: string[];
  contacts: Contacts;
}

export interface EmailMessage {
  id: string;
  from: "me" | "client";
  body: string;
  html?: string;
  createdAt: string;
}

export interface EmailThread {
  id: string;
  to: string;
  toName?: string;
  subject: string;
  messages: EmailMessage[];
  status: "sent" | "replied" | "closed";
  createdAt: string;
  updatedAt: string;
  messageId: string;
}

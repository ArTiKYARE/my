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

export interface Contacts {
  email?: string;
  telegram?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

export interface Profile {
  name: string;
  role: string;
  photo: string;
  bio: string;
  skills: string[];
  contacts: Contacts;
}

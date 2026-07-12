"use server";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { Project, Profile, Lead, LeadStatus, Post, EmailThread } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function getProjects(): Promise<Project[]> {
  return readJsonFile<Project[]>(PROJECTS_FILE, []);
}

export async function getProfile(): Promise<Profile> {
  return readJsonFile<Profile>(PROFILE_FILE, {
    name: "Ваше Имя",
    role: "Разработчик",
    photo: "/uploads/avatar.svg",
    bio: "",
    skills: [],
    contacts: {},
  });
}

export async function saveProject(formData: FormData) {
  const id = (formData.get("id") as string) || crypto.randomUUID();
  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string).trim();
  const logo = (formData.get("logo") as string) || "/uploads/demo-logo.svg";
  const banner = (formData.get("banner") as string) || "/uploads/demo-banner.svg";
  const tagsRaw = (formData.get("tags") as string) || "";
  const link = (formData.get("link") as string) || "";
  const github = (formData.get("github") as string) || "";

  if (!title || !description) {
    return { error: "Название и описание обязательны" };
  }

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const projects = await getProjects();
  const existingIndex = projects.findIndex((p) => p.id === id);

  const project: Project = {
    id,
    title,
    description,
    logo,
    banner,
    tags,
    link,
    github,
    createdAt:
      existingIndex >= 0
        ? projects[existingIndex].createdAt
        : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.unshift(project);
  }

  await writeJsonFile(PROJECTS_FILE, projects);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, project };
}

export async function deleteProject(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID проекта не указан" };

  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) {
    return { error: "Проект не найден" };
  }

  await writeJsonFile(PROJECTS_FILE, filtered);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function saveProfile(formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const role = (formData.get("role") as string).trim();
  const photo = (formData.get("photo") as string) || "/uploads/avatar.svg";
  const bio = (formData.get("bio") as string).trim();
  const skillsRaw = (formData.get("skills") as string) || "";

  const contacts: Record<string, string> = {};
  const contactFields = ["email", "phone", "telegram", "github", "linkedin", "website"];
  for (const field of contactFields) {
    const value = (formData.get(`contacts.${field}`) as string) || "";
    if (value.trim()) contacts[field] = value.trim();
  }

  if (!name) {
    return { error: "Имя обязательно" };
  }

  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const profile: Profile = {
    name,
    role,
    photo,
    bio,
    skills,
    contacts,
  };

  await writeJsonFile(PROFILE_FILE, profile);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, profile };
}
const VALID_STATUSES: LeadStatus[] = ["new", "in-progress", "done", "archived"];

export async function getLeads(): Promise<Lead[]> {
  const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);
  const normalized = leads.map((lead) => ({
    ...lead,
    status: VALID_STATUSES.includes(lead.status) ? lead.status : "new",
  }));
  return normalized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead | null> {
  const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  leads[index] = { ...leads[index], status };
  await writeJsonFile(LEADS_FILE, leads);
  return leads[index];
}
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

export async function getPosts(): Promise<Post[]> {
  const posts = await readJsonFile<Post[]>(POSTS_FILE, []);
  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function savePost(formData: FormData) {
  const id = (formData.get("id") as string) || crypto.randomUUID();
  const title = (formData.get("title") as string).trim();
  const slug =
    (formData.get("slug") as string).trim() ||
    title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const excerpt = (formData.get("excerpt") as string).trim();
  const content = (formData.get("content") as string).trim();
  const cover = (formData.get("cover") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "";

  if (!title || !slug || !excerpt || !content) {
    return { error: "Заголовок, slug, анонс и содержание обязательны" };
  }

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const posts = await getPosts();
  const existingIndex = posts.findIndex((p) => p.id === id);

  const post: Post = {
    id,
    title,
    slug,
    excerpt,
    content,
    cover,
    tags,
    publishedAt:
      existingIndex >= 0
        ? posts[existingIndex].publishedAt
        : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.unshift(post);
  }

  await writeJsonFile(POSTS_FILE, posts);
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  return { success: true, post };
}

export async function deletePost(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID публикации не указан" };

  const posts = await getPosts();
  const filtered = posts.filter((p) => p.id !== id);

  if (filtered.length === posts.length) {
    return { error: "Публикация не найдена" };
  }

  await writeJsonFile(POSTS_FILE, filtered);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  return { success: true };
}

const EMAIL_THREADS_FILE = path.join(DATA_DIR, "email_threads.json");

export async function getEmailThreads(): Promise<EmailThread[]> {
  const threads = await readJsonFile<EmailThread[]>(EMAIL_THREADS_FILE, []);
  return threads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getEmailThreadById(id: string): Promise<EmailThread | null> {
  const threads = await getEmailThreads();
  return threads.find((t) => t.id === id) || null;
}

export async function saveEmailThread(thread: EmailThread) {
  const threads = await readJsonFile<EmailThread[]>(EMAIL_THREADS_FILE, []);
  const index = threads.findIndex((t) => t.id === thread.id);
  if (index >= 0) {
    threads[index] = thread;
  } else {
    threads.unshift(thread);
  }
  await writeJsonFile(EMAIL_THREADS_FILE, threads);
  return thread;
}

export async function updateEmailThreadStatus(
  id: string,
  status: EmailThread["status"]
): Promise<EmailThread | null> {
  const thread = await getEmailThreadById(id);
  if (!thread) return null;
  thread.status = status;
  thread.updatedAt = new Date().toISOString();
  await saveEmailThread(thread);
  return thread;
}
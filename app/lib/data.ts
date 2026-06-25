"use server";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { Project, Profile, Lead, LeadStatus } from "./types";

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

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
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
  const contactFields = ["email", "telegram", "github", "linkedin", "website"];
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

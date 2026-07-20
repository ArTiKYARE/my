import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import { getProfile, getProjects, getPosts } from "../lib/data";
import AdminDashboard from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard/login");
  }

  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  return (
    <AdminDashboard
      profile={profile}
      projects={projects}
      posts={posts}
      role={session.role}
    />
  );
}

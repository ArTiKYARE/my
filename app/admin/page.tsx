import { redirect } from "next/navigation";
import { isAuthenticated } from "../lib/auth";
import { getProfile, getProjects } from "../lib/data";
import AdminDashboard from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  const [profile, projects] = await Promise.all([
    getProfile(),
    getProjects(),
  ]);

  return <AdminDashboard profile={profile} projects={projects} />;
}

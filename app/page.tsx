export const dynamic = "force-dynamic";

import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import StickyCTA from "./components/StickyCTA";
import { getProfile, getProjects } from "./lib/data";

export default async function Home() {
  const [profile, projects] = await Promise.all([
    getProfile(),
    getProjects(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <About profile={profile} />
        <Skills skills={profile.skills} />
        <Projects projects={projects} />
        <Contact contacts={profile.contacts} />
      </main>
      <Footer name={profile.name} />
      <StickyCTA />
    </>
  );
}

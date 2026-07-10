export const dynamic = "force-dynamic";

import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import StickyCTA from "./components/StickyCTA";
import ScrollReveal from "./components/ScrollReveal";
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
        <ScrollReveal>
          <About profile={profile} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <Skills skills={profile.skills} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <Projects projects={projects} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <Contact contacts={profile.contacts} />
        </ScrollReveal>
      </main>
      <Footer name={profile.name} />
      <StickyCTA />
    </>
  );
}

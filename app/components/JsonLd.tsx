import { getProfile } from "../lib/data";

const BASE_URL = "https://kos-ko.ru";

export default async function JsonLd() {
  const profile = await getProfile();

  const sameAs = [
    profile.contacts.telegram,
    profile.contacts.github,
    profile.contacts.linkedin,
    profile.contacts.website,
  ].filter(Boolean);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.name,
    alternateName: "Kos-Ko Studio",
    url: BASE_URL,
    logo: `${BASE_URL}/logo-light.png`,
    description: profile.bio.replace(/\n/g, " "),
    contactPoint: profile.contacts.email
      ? {
          "@type": "ContactPoint",
          email: profile.contacts.email,
          contactType: "sales",
          availableLanguage: ["Russian"],
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.name,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}

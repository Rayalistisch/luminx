// Homepage copy shared by the HTML journey and the 3D labels.

export const PROJECTS = [
  {
    id: "dg-rubber",
    title: "DG Rubber Profiles",
    result: "PageSpeed 100 over alle secties",
    tag: "Custom WordPress",
    description: "Volledig custom WordPress-website met eigen huisstijl in front-end én back-end, met nagenoeg geen plugins.",
    image: "/images/dg-rubber-profiles.png",
    href: "/cases/dg-rubber-profiles",
  },
  {
    id: "gsm-team",
    title: "GSM Team",
    result: "40% snellere laadtijd, 0 dagen downtime",
    tag: "Migratie",
    description: "WordPress → Shopify-migratie met volledig behoud van SEO-waarde.",
    image: "/images/website-gsmteam.png",
    href: "/cases/migraties",
  },
  {
    id: "reservax",
    title: "ReservaX / ActifAid",
    result: "5+ uur per week teruggewonnen",
    tag: "Websites · Procesautomation",
    description: "Custom afsprakensysteem dat handmatige planning volledig vervangt.",
    image: "/images/reservaxactifaid.png",
    href: "/cases/custom-applicaties",
  },
  {
    id: "ascendio",
    title: "Ascendio",
    result: "3× meer organisch verkeer",
    tag: "SEO · AI-automation",
    description: "AI-gedreven contentclusters die autoriteit en verkeer laten samenkomen.",
    image: "/images/ascendio seo automation.jpg",
    href: "/cases/digital-marketing",
  },
];

export const MARKETING = [
  { title: "SEO", desc: "Structureel gevonden worden op wat je klanten zoeken.", href: "/diensten/seo" },
  { title: "SEA – Google Ads", desc: "Direct bovenaan met winstgevende campagnes.", href: "/diensten/sea" },
  { title: "Social advertising", desc: "Bereik en conversie op Meta, TikTok & LinkedIn.", href: "/diensten/social-advertising" },
  { title: "E-mailmarketing", desc: "Automatische flows die klanten laten terugkomen.", href: "/diensten/emailmarketing" },
  { title: "GEO – AI-zichtbaarheid", desc: "Genoemd worden in AI-antwoorden en chatbots.", href: "/diensten/geo" },
];

export const TECH = [
  { title: "Websites", desc: "Razendsnelle sites die laden én converteren.", href: "/diensten/websites" },
  { title: "AI-websites", desc: "Snel live, en gebouwd om gevonden te worden.", href: "/diensten/ai-websites" },
  { title: "Webshops", desc: "Schaalbare shops op Shopify of maatwerk.", href: "/diensten/webshops" },
  { title: "Procesautomatisering", desc: "Handmatig werk eruit, data erin.", href: "/diensten/procesautomation" },
  { title: "Tag Manager, GA4 & Consent", desc: "Betrouwbaar meten wat mag, en wat werkt.", href: "/diensten/google-tag-manager" },
];

export const BELIEFS = [
  { title: "We verwijderen frictie.", body: "Eerst dichten wat nu lekt, daarna pas budget naar meer verkeer." },
  { title: "We automatiseren het werk.", body: "Systemen gekoppeld, zodat terugkerend werk zichzelf doet." },
  { title: "We engineeren groei.", body: "Betrouwbare data, en alleen opschalen wat aantoonbaar werkt." },
  { title: "We bouwen digitale bedrijven.", body: "Website, marketing en automatisering als één systeem." },
];

export const STATS = [
  { value: "150%", label: "Effectiever werken" },
  { value: "10+", label: "Klanten" },
  { value: "5+", label: "Jaren ervaring" },
  { value: "2", label: "Awards" },
];

/** Every place in the land, in tour order. */
export const PLACES: { id: string; kind: "service" | "project" | "home"; pin: string; pinSub: string }[] = [
  { id: "marketing", kind: "service", pin: "Online marketing", pinSub: "De molen" },
  { id: "techniek", kind: "service", pin: "Techniek & automatisering", pinSub: "De textielfabriek" },
  ...PROJECTS.map((p) => ({ id: p.id, kind: "project" as const, pin: p.title, pinSub: p.result })),
  { id: "luminx", kind: "home", pin: "LuminX", pinSub: "Over ons & contact" },
];

/** Shortcuts shown in the intro. */
export const SHORTCUTS = [
  { id: "marketing", label: "Online marketing", kind: "service" },
  { id: "techniek", label: "Techniek & automatisering", kind: "service" },
  { id: "dg-rubber", label: "Ons werk", kind: "project" },
  { id: "luminx", label: "Over & contact", kind: "home" },
];

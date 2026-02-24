export interface City {
  name: string;
  slug: string;
  context: string;
}

export interface ServiceDef {
  label: string;
  icon: string;
  metaTitle: (city: string) => string;
  metaDesc: (city: string) => string;
  intro: (city: string, context: string) => string;
  metrics: { value: string; label: string }[];
  painPoints: string[];
  highlights: string[];
  process: string[];
  outcomes: string[];
}

export const cities: City[] = [
  {
    name: "Enschede",
    slug: "enschede",
    context:
      "Als grootste stad van Twente is Enschede een bruisend centrum voor tech, innovatie en ondernemerschap — mede aangedreven door de Universiteit Twente.",
  },
  {
    name: "Hengelo",
    slug: "hengelo",
    context:
      "Hengelo is een industriële sleutelstad in Twente met grote namen als Thales en een sterk B2B-ecosysteem dat steeds verder digitaliseert.",
  },
  {
    name: "Almelo",
    slug: "almelo",
    context:
      "Almelo is een ondernemende stad in het hart van Twente, met een sterk MKB-klimaat en groeiende behoefte aan digitale aanwezigheid en procesefficiëntie.",
  },
  {
    name: "Oldenzaal",
    slug: "oldenzaal",
    context:
      "Oldenzaal is een compacte ondernemersstad op de grens met Duitsland — strategisch gelegen en volop in beweging voor lokale en regionale groei.",
  },
];

export const services: Record<string, ServiceDef> = {
  "web-development": {
    label: "Web Development",
    icon: "✦",
    metaTitle: (city) => `Web Development ${city} | LuminX — Webbureau Twente`,
    metaDesc: (city) =>
      `Op zoek naar een professioneel webbureau in ${city}? LuminX bouwt snelle, converterende websites voor bedrijven in ${city} en heel Twente.`,
    intro: (city, context) =>
      `${context} LuminX helpt bedrijven in ${city} met een website die niet alleen premium oogt, maar ook technisch sterk presteert en meetbaar meer oplevert.`,
    metrics: [
      { value: "90+", label: "Core Web Vitals" },
      { value: "3-6 weken", label: "Naar live" },
      { value: "Conversion-led", label: "Design + data" },
    ],
    painPoints: [
      "Een site die visueel oké is maar technisch traag presteert",
      "Onvoldoende structuur voor SEO en schaalbare content",
      "Design en development sluiten niet aan op conversiedoelen",
      "Geen betrouwbare tracking van gedrag en leadkwaliteit",
    ],
    highlights: [
      "Custom design en frontend met sterke merkidentiteit",
      "Technische optimalisatie voor performance, SEO en toegankelijkheid",
      "Modulaire opbouw zodat je website makkelijk doorontwikkelt",
      "Robuuste analytics en eventtracking voor betere sturing",
    ],
    process: [
      "Strategische intake op doelen, doelgroep en propositie",
      "UX-architectuur, wireframes en visuele richting",
      "Development, QA en validatie op device- en browsertype",
      "Lancering met meetplan en roadmap voor iteratieve groei",
    ],
    outcomes: [
      "Snellere website-ervaring en hogere gebruikskwaliteit",
      "Meer kwalitatieve aanvragen via duidelijke funnels",
      "Sterkere online merkbeleving over alle pagina's",
      "Betere beslissingen op basis van betrouwbare data",
    ],
  },
  "online-marketing": {
    label: "Online Marketing",
    icon: "✧",
    metaTitle: (city) =>
      `Online Marketing ${city} | LuminX — Marketingbureau Twente`,
    metaDesc: (city) =>
      `Online marketing bureau in ${city}? LuminX realiseert meetbare groei via SEA, social en funneloptimalisatie voor bedrijven in ${city} en heel Twente.`,
    intro: (city, context) =>
      `${context} LuminX bouwt voor bedrijven in ${city} een online marketingmachine die kanalen, campagnes en conversie samenbrengt in een schaalbare aanpak met meetbare impact.`,
    metrics: [
      { value: "+30-70%", label: "Meer kwalitatieve leads" },
      { value: "-15-35%", label: "Lagere CPA" },
      { value: "Altijd-aan", label: "Optimalisatiecyclus" },
    ],
    painPoints: [
      "Campagnes draaien los van elkaar zonder centrale strategie",
      "Budget gaat naar kanalen met beperkte aantoonbare impact",
      "Onvoldoende inzicht in funnellekken en conversieknelpunten",
      "Sturing gebeurt op onderbuik in plaats van consistente data",
    ],
    highlights: [
      "Kanaalstrategie met duidelijke rol per fase in de klantreis",
      "Campagne-opzet voor SEA, social en remarketing met meetplan",
      "Landingpage- en funneloptimalisatie op basis van gedrag",
      "Dashboarding op KPI's zoals CPL, CPA, ROAS en leadkwaliteit",
    ],
    process: [
      "Nulmeting van kanaaldata, doelgroep en huidige funnel",
      "Strategie en prioriteiten op basis van impact en haalbaarheid",
      "Implementatie van campagnes, creatives en tracking",
      "Wekelijkse optimalisatie op performance en conversie",
    ],
    outcomes: [
      "Meer voorspelbaarheid in leadinstroom en omzet",
      "Betere marketingrendementen per kanaal en campagne",
      "Snellere iteraties door duidelijke datafeedback",
      "Groei die schaalbaar is zonder verlies aan kwaliteit",
    ],
  },
  procesautomation: {
    label: "Procesautomation",
    icon: "◆",
    metaTitle: (city) =>
      `Procesautomatisering ${city} | LuminX — Bureau Twente`,
    metaDesc: (city) =>
      `Procesautomatisering in ${city}? LuminX helpt bedrijven in ${city} repetitieve taken automatiseren voor minder handwerk en meer efficiëntie in Twente.`,
    intro: (city, context) =>
      `${context} LuminX brengt voor bedrijven in ${city} repetitieve taken in kaart en bouwt slimme automatiseringen die direct tijd besparen, fouten verminderen en teams meer focus geven.`,
    metrics: [
      { value: "20-40%", label: "Minder handwerk" },
      { value: "4-8 weken", label: "Eerste live flow" },
      { value: "Senior-led", label: "Van analyse tot adoptie" },
    ],
    painPoints: [
      "Processen draaien op losse Excel-bestanden en e-mailafstemming",
      "Veel fouten door handmatige overdracht tussen tools",
      "Geen realtime inzicht in status, doorlooptijd en capaciteit",
      "Het team verliest uren aan terugkerende operationele taken",
    ],
    highlights: [
      "Procesaudit met duidelijke bottlenecks en quick wins",
      "Automatisering van handmatige stappen via no-code of maatwerk",
      "Slimme integraties zodat data automatisch doorloopt",
      "Dashboards met stuurinformatie voor operatie en management",
    ],
    process: [
      "Kickoff en procesmapping met stakeholders uit operatie en management",
      "Selectie van quick wins, scope-definitie en implementatieplan",
      "Bouw, test en gefaseerde livegang met fallback scenario's",
      "Training, documentatie en doorlopende optimalisatie op data",
    ],
    outcomes: [
      "Kortere doorlooptijden in primaire processen",
      "Minder operationele fouten en herstelwerk",
      "Betere voorspelbaarheid van capaciteit en planning",
      "Meer tijd in teams voor klantwaarde en groei",
    ],
  },
  strategy: {
    label: "Strategie",
    icon: "●",
    metaTitle: (city) => `Digitale Strategie ${city} | LuminX — Bureau Twente`,
    metaDesc: (city) =>
      `Digitale strategie voor bedrijven in ${city}? LuminX vertaalt ambitie naar een heldere roadmap met concrete KPI's voor voorspelbare groei in Twente.`,
    intro: (city, context) =>
      `${context} LuminX helpt bedrijven in ${city} digitale ambitie te vertalen naar scherpe keuzes, concrete prioriteiten en een uitvoerbare roadmap met meetbare doelen.`,
    metrics: [
      { value: "2-4 weken", label: "Strategie sprint" },
      { value: "1 roadmap", label: "Met prioriteiten" },
      { value: "Meetbaar", label: "KPI & governance" },
    ],
    painPoints: [
      "Veel initiatieven, maar geen heldere focus of prioritering",
      "Marketing en operatie werken langs elkaar heen",
      "Budget wordt verdeeld zonder duidelijke impacthypothese",
      "KPI's zijn niet gekoppeld aan bedrijfsdoelen",
    ],
    highlights: [
      "Aanscherping van positionering en waardepropositie",
      "Datagedreven kanaalkeuzes en investeringsprioriteiten",
      "Roadmap met eigenaarschap, timing en afhankelijkheden",
      "KPI-framework en ritme voor evaluatie en bijsturing",
    ],
    process: [
      "Analyse van markt, doelgroep, funnel en huidige prestaties",
      "Strategische keuzes in focus, proposities en kanaalmix",
      "Vertaling naar roadmap, planning en teamverantwoordelijkheden",
      "Inrichting van governance, rapportage en besluitvorming",
    ],
    outcomes: [
      "Meer focus op initiatieven met aantoonbare impact",
      "Snellere besluitvorming door duidelijke prioriteiten",
      "Betere samenwerking tussen marketing, sales en operatie",
      "Voorspelbare groei door structurele sturing op KPI's",
    ],
  },
};

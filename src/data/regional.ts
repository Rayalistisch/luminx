export interface City {
  name: string;
  slug: string;
  context: string;
  marketNote?: string;
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
      "Als grootste stad van Twente is Enschede een bruisend centrum voor tech, innovatie en ondernemerschap, mede aangedreven door de Universiteit Twente, Grolsch en het prachtige Fc Twente.",
    marketNote:
      "De concurrentie in Enschede is online merkbaar: veel lokale dienstverleners zijn al actief met Google Ads en SEO. Wie nu investeert in een doordachte aanpak, bouwt een voorsprong die moeilijk in te halen is.",
  },
  {
    name: "Hengelo",
    slug: "hengelo",
    context:
      "Hengelo is een industriële sleutelstad in Twente met grote namen als Thales en een sterk B2B-ecosysteem dat steeds verder digitaliseert.",
    marketNote:
      "Hengelose bedrijven — zeker in de B2B-sector — lopen vaak achter op digitale zichtbaarheid. Dat is een kans: wie nu een sterke online positie opbouwt, pakt marktaandeel van concurrenten die nog niet bewegen.",
  },
  {
    name: "Almelo",
    slug: "almelo",
    context:
      "Almelo is een ondernemende stad in het hart van Twente, met een sterk MKB-klimaat en groeiende behoefte aan digitale aanwezigheid en procesefficiëntie.",
    marketNote:
      "In Almelo is de online marketing markt nog relatief open. Voor MKB-bedrijven die nu starten met een gestructureerde aanpak, zijn de kosten per lead lager dan in grotere steden — met hogere kansen op een sterke lokale positie.",
  },
  {
    name: "Oldenzaal",
    slug: "oldenzaal",
    context:
      "Oldenzaal is een compacte ondernemersstad op de grens met Duitsland — strategisch gelegen en volop in beweging voor lokale en regionale groei.",
    marketNote:
      "De ligging van Oldenzaal maakt het interessant voor bedrijven die zowel de Nederlandse als de Duitse markt willen bedienen. Online marketing kan die tweeledige doelgroep effectief bereiken.",
  },
];

export const services: Record<string, ServiceDef> = {
  "web-development": {
    label: "Web Development",
    icon: "✦",
    metaTitle: (city) => `Web Development ${city} | LuminX — Marketing Partner in Twente`,
    metaDesc: (city) =>
      `Op zoek naar een professionele partner in ${city}? LuminX bouwt snelle, converterende websites voor bedrijven in ${city} en heel Twente.`,
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
  seo: {
    label: "SEO",
    icon: "◎",
    metaTitle: (city) =>
      `SEO Specialist ${city} | LuminX — SEO Bureau Twente`,
    metaDesc: (city) =>
      `Op zoek naar een SEO specialist in ${city}? LuminX vergroot je organisch bereik met technische SEO, contentstrategie en linkbuilding voor bedrijven in ${city} en Twente.`,
    intro: (city, context) =>
      `${context} LuminX helpt bedrijven in ${city} structureel hoger scoren in Google. Met een SEO-aanpak die technisch sterk is, aansluit op zoekintentie en langdurig resultaat oplevert.`,
    metrics: [
      { value: "+40-120%", label: "Meer organisch verkeer" },
      { value: "3-6 mnd", label: "Eerste aantoonbare stijging" },
      { value: "Duurzaam", label: "Geen afhankelijkheid van ads" },
    ],
    painPoints: [
      "Nauwelijks zichtbaar in Google buiten branded zoekopdrachten",
      "Concurrenten scoren hoger op zoekwoorden die voor jou relevant zijn",
      "Bestaande content genereert weinig organisch verkeer of leads",
      "Geen inzicht in welke pagina's presteren en waarom",
    ],
    highlights: [
      "Technische SEO-audit en doorlopende optimalisatie van crawlbaarheid",
      "Zoekwoordstrategie op basis van intentie, volume en haalbaarheid",
      "On-page optimalisatie van content, structuur en interne linking",
      "Linkbuilding met kwalitatieve, relevante bronnen in jouw niche",
    ],
    process: [
      "Technische audit, zoekwoordonderzoek en concurrentieanalyse",
      "Prioriteiten op basis van impact: techniek, content of autoriteit",
      "Implementatie van optimalisaties on-page en off-page",
      "Maandelijkse rapportage op rankings, organisch verkeer en conversie",
    ],
    outcomes: [
      "Hogere organische posities op commercieel relevante zoektermen",
      "Structureel meer kwalitatief verkeer zonder lopend advertentiebudget",
      "Betere gebruikerservaring en hogere conversie vanuit organisch kanaal",
      "Inzicht in SEO-prestaties via heldere maandrapportage",
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
  sea: {
    label: "SEA & Google Ads",
    icon: "▲",
    metaTitle: (city) => `SEA & Google Ads ${city} | LuminX — Bureau Twente`,
    metaDesc: (city) =>
      `Google Ads bureau in ${city}? LuminX beheert betaalde campagnes voor bedrijven in ${city} met focus op lagere kosten en meer kwalitatieve leads in Twente.`,
    intro: (city, context) =>
      `${context} LuminX beheert voor bedrijven in ${city} betaalde zoekcampagnes die direct zichtbaar zijn op de momenten die ertoe doen — met scherpe targeting en aantoonbaar rendement.`,
    metrics: [
      { value: "-20-40%", label: "Lagere CPC" },
      { value: "+35-65%", label: "Meer conversies" },
      { value: "Wekelijks", label: "Optimalisatiecyclus" },
    ],
    painPoints: [
      "Hoog advertentiebudget met weinig aantoonbare return",
      "Campagnes draaien op standaardinstellingen zonder optimalisatie",
      "Onvoldoende inzicht in welke zoekwoorden echt converteren",
      "Geen koppeling tussen advertentiedata en CRM of omzet",
    ],
    highlights: [
      "Zoekwoordstrategie op basis van intentie en concurrentieanalyse",
      "Campagnestructuur voor Search, Display en Remarketing",
      "Conversietracking en attributie voor betrouwbare sturing",
      "Wekelijkse optimalisatie op kwaliteitsscore, bod en advertentieteksten",
    ],
    process: [
      "Accountaudit en analyse van huidige campagnes en budget",
      "Zoekwoordonderzoek en campagnearchitectuur per doelstelling",
      "Opzet van tracking, doelgroepen en remarketinglijsten",
      "Continue optimalisatie met maandelijkse rapportage",
    ],
    outcomes: [
      "Meer zichtbaarheid op relevante zoekopdrachten in de regio",
      "Lagere kosten per klik en kosten per conversie",
      "Betere leadkwaliteit door scherpe targeting",
      "Volledig inzicht in rendement per campagne en zoekwoord",
    ],
  },
  "bedrijfsautomatisering": {
    label: "Bedrijfsautomatisering",
    icon: "⬡",
    metaTitle: (city) =>
      `Bedrijfsautomatisering ${city} | LuminX — Bureau Twente`,
    metaDesc: (city) =>
      `Bedrijfsautomatisering in ${city}? LuminX helpt bedrijven in ${city} handmatige processen elimineren en operationele efficiëntie structureel verbeteren.`,
    intro: (city, context) =>
      `${context} LuminX helpt bedrijven in ${city} hun operatie te stroomlijnen door slimme automatisering van terugkerende taken — van offertes en facturatie tot voorraadbeheer en klantcommunicatie.`,
    metrics: [
      { value: "30-60%", label: "Minder handmatig werk" },
      { value: "4-10 weken", label: "Eerste resultaat" },
      { value: "ROI-first", label: "Prioriteit op rendement" },
    ],
    painPoints: [
      "Medewerkers besteden uren aan repetitief administratief werk",
      "Fouten door handmatige overdracht tussen systemen en afdelingen",
      "Processen zijn niet schaalbaar naarmate het bedrijf groeit",
      "Geen realtime overzicht van status, capaciteit of doorlooptijd",
    ],
    highlights: [
      "Procesaudit met prioritering op basis van tijdsbesparing en ROI",
      "Automatisering van administratieve workflows en goedkeuringsstromen",
      "Koppelingen tussen ERP, CRM, boekhouding en communicatietools",
      "Dashboards voor operationele sturing en managementrapportage",
    ],
    process: [
      "Inventarisatie van handmatige processen en bottlenecks",
      "Selectie van automatiseringen met hoogste impact per tijdsinvestering",
      "Bouw, test en gefaseerde implementatie met terugvalscenario's",
      "Adoptieondersteuning, training en doorlopende optimalisatie",
    ],
    outcomes: [
      "Significant minder tijd kwijt aan administratieve taken",
      "Minder fouten en herstelwerk in de dagelijkse operatie",
      "Sneller schalen zonder evenredige groei in personeel",
      "Beter inzicht in operationele prestaties en capaciteit",
    ],
  },
  "marketing-automation": {
    label: "Marketing Automation",
    icon: "◈",
    metaTitle: (city) =>
      `Marketing Automation ${city} | LuminX — Bureau Twente`,
    metaDesc: (city) =>
      `Marketing automation in ${city}? LuminX bouwt geautomatiseerde marketingflows voor bedrijven in ${city} die leads nurturen en conversies verhogen zonder extra handwerk.`,
    intro: (city, context) =>
      `${context} LuminX bouwt voor bedrijven in ${city} geautomatiseerde marketingflows die leads op het juiste moment opvolgen, nurturen en converteren — zonder handmatig ingrijpen.`,
    metrics: [
      { value: "+40-80%", label: "Hogere leadopvolging" },
      { value: "-50%", label: "Minder handmatig werk" },
      { value: "Altijd-aan", label: "Nurturing flows" },
    ],
    painPoints: [
      "Leads vallen weg omdat opvolging te traag of inconsistent is",
      "Marketingcampagnes zijn losstaand zonder geautomatiseerde opvolging",
      "Geen gepersonaliseerde communicatie op basis van gedrag",
      "Te veel tijd kwijt aan handmatige e-mails en segmentatie",
    ],
    highlights: [
      "Leadnurturing flows op basis van gedrag en funnel-fase",
      "Geautomatiseerde opvolging via e-mail, SMS en retargeting",
      "CRM-integratie voor naadloze overdracht van marketing naar sales",
      "A/B-testing en optimalisatie van flows op conversie",
    ],
    process: [
      "Klantreis in kaart brengen van eerste contact tot aankoop",
      "Opzet van segmentatie, triggers en communicatieflows",
      "Technische implementatie en koppeling met CRM en analytics",
      "Doorlopende optimalisatie op openrates, clicks en conversies",
    ],
    outcomes: [
      "Consistente en tijdige opvolging van elke lead",
      "Meer conversies zonder extra marketinginspanning",
      "Beter inzicht in welke content en flows het beste presteren",
      "Schaalbare marketingmachine die groeit met je bedrijf",
    ],
  },
  "emailmarketing": {
    label: "E-mailmarketing",
    icon: "◉",
    metaTitle: (city) =>
      `E-mailmarketing ${city} | LuminX — Marketingbureau Twente`,
    metaDesc: (city) =>
      `E-mailmarketing bureau in ${city}? LuminX ontwikkelt e-mailstrategieën en campagnes voor bedrijven in ${city} die leiden tot meer omzet en klantbinding in Twente.`,
    intro: (city, context) =>
      `${context} LuminX ontwikkelt voor bedrijven in ${city} e-mailmarketingstrategieën die verder gaan dan nieuwsbrieven — gericht op relevantie, timing en meetbare omzetbijdrage.`,
    metrics: [
      { value: "35-55%", label: "Gemiddelde open rate" },
      { value: "+25%", label: "Meer herhaalomzet" },
      { value: "GDPR-proof", label: "Compliant & veilig" },
    ],
    painPoints: [
      "Nieuwsbrieven worden nauwelijks geopend of doorgelezen",
      "Geen segmentatie: iedereen ontvangt dezelfde berichten",
      "Onvoldoende inzicht in wat e-mailcampagnes daadwerkelijk opleveren",
      "Handmatig versturen kost tijd en leidt tot inconsistente planning",
    ],
    highlights: [
      "E-mailstrategie afgestemd op klantreis en bedrijfsdoelen",
      "Segmentatie en personalisatie op basis van gedrag en profiel",
      "Template-ontwerp dat aansluit op merkidentiteit en converteert",
      "Volledige rapportage op opens, clicks, conversies en omzet",
    ],
    process: [
      "Analyse van huidige lijst, segmenten en campagnehistorie",
      "Strategie voor frequentie, inhoud en automatiseringsmomenten",
      "Opzet van templates, flows en integrations met je platform",
      "Continue optimalisatie op basis van data en A/B-tests",
    ],
    outcomes: [
      "Hogere openrates en doorklikratio's door betere relevantie",
      "Meer omzet uit bestaande klanten via gerichte opvolging",
      "Consistente communicatie zonder extra tijdsinvestering",
      "Volledig inzicht in de bijdrage van e-mail aan je groei",
    ],
  },
};

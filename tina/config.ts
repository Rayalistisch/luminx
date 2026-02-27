import { defineConfig } from "tinacms";

export default defineConfig({
  // Verbind met TinaCloud voor productie-editing op luminx.nl/admin
  // Registreer gratis op tina.io en vul deze waarden in via omgevingsvariabelen
  branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
  clientId: process.env.TINA_CLIENT_ID ?? null,
  token: process.env.TINA_TOKEN ?? null,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      {
        name: "blog",
        label: "Blog artikelen",
        path: "src/content/blog",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titel",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Omschrijving (voor Google)",
            required: true,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publicatiedatum",
            required: true,
          },
          {
            type: "string",
            name: "author",
            label: "Auteur",
          },
          {
            type: "string",
            name: "category",
            label: "Categorie",
            options: [
              "Online Marketing",
              "SEO",
              "SEA",
              "Strategie",
              "Web Development",
              "Procesautomatisering",
            ],
          },
          {
            type: "image",
            name: "image",
            label: "Omslagafbeelding (optioneel)",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Inhoud",
            isBody: true,
          },
        ],
      },
    ],
  },
});

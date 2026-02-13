# LUMINX Website

Astro-website voor LUMINX met dienstenpagina's, casepagina's en interactieve homepage-secties.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

## SEO Setup

SEO-head is centraal geregeld in `src/layouts/BaseLayout.astro`.

Toegevoegd:
- `canonical`
- `meta robots`
- Open Graph tags (`og:type`, `og:site_name`, `og:locale`, `og:title`, `og:description`, `og:url`, `og:image`)
- Twitter tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### Gebruik per pagina

Je kunt optioneel `robots` en `ogImage` doorgeven aan `BaseLayout`.

Voorbeeld:

```astro
<BaseLayout
  title="Pagina titel"
  description="Korte omschrijving"
  robots="index,follow,max-image-preview:large"
  ogImage="/images/luminx-founder.png"
>
  ...
</BaseLayout>
```

## Tracking (dataLayer)

Tracking staat in `public/scripts/tracking.js` en wordt geladen via `BaseLayout`.

### Data layer init
- `window.dataLayer = window.dataLayer || []`
- Helper: `window.luminxTrack(eventName, payload)`

### Events

1. `cta_click`
- Trigger: klik op CTA-elementen (o.a. `[data-overlay-open]`, `.cta-button`, `.footer-contact-cta`, `.nav-cta`)
- Payload:
  - `cta_label`
  - `cta_section`
  - `page_path`
  - `page_title`

2. `contact_submit`
- Trigger: submit van formulier `#contact-form` in overlay
- Payload:
  - `form_id` (`contact-form`)
  - `page_path`
  - `page_title`

Implementatie submit-event zit in `public/scripts/contact-overlay.js`.

## Structuur

Belangrijkste routes:
- `/site` (hoofdsite)
- `/diensten/*` (service detailpagina's)
- `/cases/*` (case detailpagina's)

Belangrijkste componenten:
- `src/components/ServicePage.astro`
- `src/components/CasePage.astro`
- `src/components/ImageGrid.astro`
- `src/components/Nav.astro`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Margarita Renace** is a rental marketplace for apartments and cars in Isla de Margarita, Venezuela. It originated as a Google AI Studio applet (`ai-studio-applet`, see `metadata.json`) built with Next.js. The site is Spanish-language, prices are in US$, and the design language is a Caribbean/coastal glassmorphism aesthetic (teal/cyan gradients, sand background, frosted-glass panels) layered over an editorial serif+sans type system.

A second surface — an admin dashboard for managing listings/reservations — is planned on a separate subdomain, sharing this codebase's stack and conventions.

## Commands

```bash
npm install       # install dependencies (Node 24 / npm 11 in this environment; no bun/pnpm/yarn installed)
npm run dev       # start Next.js dev server (http://localhost:3000, hot reload)
npm run build     # production build
npm run start     # run the production build
npm run lint      # eslint via eslint-config-next
npm run clean     # next clean
```

There is no test suite configured in this repo.

Environment variables live in `.env.local` (gitignored; copy from `.env.example`). `GEMINI_API_KEY` and `APP_URL` are injected automatically at runtime when deployed via AI Studio; for local dev they must be set manually if Gemini API calls are exercised.

## Architecture

This is a Next.js 15 App Router project, but nearly the entire product currently lives in a **single client component**: `app/page.tsx` (~1500 lines). There is no routing beyond `/` yet — `/admin` and any car-rental-specific routes do not exist yet and will need new route segments under `app/`.

Key structural facts to know before editing:

- **Everything is client-side state, no backend.** The dataset is a hardcoded `PROPERTIES: Property[]` array (apartment listings for Margarita — Pampatar, Porlamar, Juan Griego, etc.). There is no database, no API routes, no persistence. Filtering, search, booking, and the "confirmation" flow are all local `useState`/derived-array logic — nothing is actually saved or sent anywhere.
- **Data lives in `lib/`, not in `page.tsx`.** As of 2026-07-26 the data model (`Property` interface, `AMENITIES_*`, `CATEGORIES`, `PROPERTIES`) was moved to **`lib/listings.ts`**, because `app/sitemap.ts` and the zone landings need the same data and cannot import it from a `'use client'` component. That module also derives `zone` and `slug` per listing and exports `ZONES` (listings grouped by zone, with min price), which is what makes `/alquiler/<zona>` generate statically. Add new listings there.
- **Only 1 of the 12 listings is real.** "Los Geranios A" (host `Margarita Renace`, own photo in `public/properties/`, price on request) is genuine; the other 11 have invented hosts, stock photos and invented ratings (4.6–4.97). This is why `lib/schema.ts` deliberately emits **no** `aggregateRating`/`Review`/`Offer` structured data — see the header comment in that file and `SEO.md`. Do not add rating markup until the listings and reviews are real.
- **One file, many responsibilities.** `app/page.tsx` still holds the page-level state machine (search/filters/popovers/selected property/booking flow) plus three components (`Home` default export, `CarouselSection`, `PropertyCard`). When extending functionality, prefer splitting new pieces into `lib/` or `components/` rather than growing this file further.
- **SEO/GEO surface** (see `SEO.md` for the full picture): `app/layout.tsx` holds the metadata + site-wide JSON-LD, `app/robots.ts` and `app/sitemap.ts` are generated at build, `app/opengraph-image.tsx` renders the social card, `app/alquiler/[zona]/page.tsx` are the static zone landings, `components/SeoSections.tsx` holds the home's zone links / FAQ / destination copy, and `lib/{site,schema,faq,zones-content}.ts` are the shared sources. Editing `lib/site.ts` propagates to metadata, sitemap and structured data at once.
- **Only apartments exist today; cars are not modeled.** The `Property` type and `PROPERTIES` array only cover apartment rentals. Adding car rentals means introducing a parallel data shape (e.g. a `Vehicle`/`Car` type) and likely a new top-level nav section/category set — do not try to force cars into the `Property` shape (it has apartment-only fields like `guestsAllowed`).
- **`lib/utils.ts`** exports `cn()` (clsx + tailwind-merge) — the expected helper for conditional Tailwind class composition; use it instead of manual string concatenation when adding conditional classes.
- **`hooks/use-mobile.ts`** exports `useIsMobile()` (768px breakpoint) — not currently wired into `page.tsx`, available for responsive logic.
- **Fonts/theme**: `app/layout.tsx` loads `Fraunces` (→ `--font-serif`, used for headings/titles) and `Jost` (→ `--font-sans`, body text, default weight 300/Light via `font-light` on `<body>`) as CSS variables, wired up in `app/globals.css` via Tailwind's `@theme`. Both via `next/font/google`, which self-hosts them at build time — that matters because the site serves users in Venezuela, where external CDNs are blocked. Follow this serif-for-headings / light-sans-for-body split when adding new UI text.
- **Design system conventions already established in `page.tsx`** — reuse these rather than inventing new ones:
  - Palette: deep teal `#0C4A5A` / `#0E7490` (primary, headings, CTAs as `bg-gradient-to-r from-[#0E7490] to-[#0C4A5A]`), teal accent `#5EEAD4` / `#2DD4BF`, sand background `#F6F4EE`, dark text `#1A1A1A`.
  - Glassmorphism: floating surfaces (navbar, search bar, popovers, drawers, cards) use `bg-white/NN backdrop-blur-{sm,md,xl,2xl}` with `border-white/NN` rather than opaque backgrounds.
  - Currency is always `US$` with `.toLocaleString()`, never hardcode another currency symbol.
  - Category IDs (`CATEGORIES`, `Property.categories`) are Spanish strings (`'Playa'`, `'Frente al Mar'`, `'Lujo'`, etc.) and double as filter keys — keep new categories consistent with this Spanish, title-case convention.
- **Images are self-hosted, and must stay that way.** They were remote Unsplash URLs until 2026-07-25; all 26 were downloaded to `public/images/` and the 56 references rewritten to local paths, because **Venezuela blocks external CDNs** and the property photos simply did not load for the site's target audience. Never point an image at an external host. They are plain `<img>` tags (not `next/image`) with `referrerPolicy="no-referrer"`, and carry `width`/`height` + `loading="lazy"` (the hero uses `fetchPriority="high"` instead, it's the LCP element). `alt` text should include zone and island — it's what ranks these photos in Google Images. `next.config.ts` still whitelists `picsum.photos` in `images.remotePatterns`, leftover from the AI Studio scaffold and unused.
- **`next.config.ts`** sets `output: 'standalone'` and disables ESLint errors during build (`eslint.ignoreDuringBuilds: true`); TypeScript errors are NOT ignored. It also conditionally disables webpack file watching when `DISABLE_HMR=true` (used by the AI Studio hosting environment) — do not remove this, it's there to prevent flicker in that environment specifically.

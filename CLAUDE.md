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

- **Everything is client-side state, no backend.** `app/page.tsx` defines a `PROPERTIES: Property[]` array as the entire dataset (hardcoded apartment listings for Margarita — Playa El Agua, Pampatar, Porlamar, Juan Griego, etc.). There is no database, no API routes, no persistence. Filtering, search, booking, and the "confirmation" flow are all local `useState`/derived-array logic — nothing is actually saved or sent anywhere.
- **One file, many responsibilities.** `app/page.tsx` contains: the data model (`Property` interface, `AMENITIES_*` constants, `CATEGORIES`), the page-level state machine (search/filters/popovers/selected property/booking flow), and three components defined in the same file (`Home` default export, `CarouselSection`, `PropertyCard`). When extending functionality, prefer splitting new pieces into their own files under `app/` or a new `components/` directory rather than growing this file further.
- **Only apartments exist today; cars are not modeled.** The `Property` type and `PROPERTIES` array only cover apartment rentals. Adding car rentals means introducing a parallel data shape (e.g. a `Vehicle`/`Car` type) and likely a new top-level nav section/category set — do not try to force cars into the `Property` shape (it has apartment-only fields like `guestsAllowed`).
- **`lib/utils.ts`** exports `cn()` (clsx + tailwind-merge) — the expected helper for conditional Tailwind class composition; use it instead of manual string concatenation when adding conditional classes.
- **`hooks/use-mobile.ts`** exports `useIsMobile()` (768px breakpoint) — not currently wired into `page.tsx`, available for responsive logic.
- **Fonts/theme**: `app/layout.tsx` loads `Cormorant_Garamond` (→ `--font-serif`, used for headings/titles) and `Jost` (→ `--font-sans`, body text, default weight 300/Light via `font-light` on `<body>`) as CSS variables, wired up in `app/globals.css` via Tailwind's `@theme`. Follow this serif-for-headings / light-sans-for-body split when adding new UI text.
- **Design system conventions already established in `page.tsx`** — reuse these rather than inventing new ones:
  - Palette: deep teal `#0C4A5A` / `#0E7490` (primary, headings, CTAs as `bg-gradient-to-r from-[#0E7490] to-[#0C4A5A]`), teal accent `#5EEAD4` / `#2DD4BF`, sand background `#F6F4EE`, dark text `#1A1A1A`.
  - Glassmorphism: floating surfaces (navbar, search bar, popovers, drawers, cards) use `bg-white/NN backdrop-blur-{sm,md,xl,2xl}` with `border-white/NN` rather than opaque backgrounds.
  - Currency is always `US$` with `.toLocaleString()`, never hardcode another currency symbol.
  - Category IDs (`CATEGORIES`, `Property.categories`) are Spanish strings (`'Playa'`, `'Frente al Mar'`, `'Lujo'`, etc.) and double as filter keys — keep new categories consistent with this Spanish, title-case convention.
- **Images** are all remote Unsplash URLs loaded via plain `<img>` tags (not `next/image`), with `referrerPolicy="no-referrer"`. `next.config.ts` currently only whitelists `picsum.photos` in `images.remotePatterns` — if migrating to `next/image` or adding a new external image host, update that config.
- **`next.config.ts`** sets `output: 'standalone'` and disables ESLint errors during build (`eslint.ignoreDuringBuilds: true`); TypeScript errors are NOT ignored. It also conditionally disables webpack file watching when `DISABLE_HMR=true` (used by the AI Studio hosting environment) — do not remove this, it's there to prevent flicker in that environment specifically.
- **`app/page.tsx.bak`** is a pre-rebrand backup of the original India/rupee-denominated demo content — safe to delete once the current rebrand is confirmed stable, not part of the active app.

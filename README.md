# Prompt Labs

A precision monochrome instrument for reusable AI prompts. Capture, organize, discover, customize (variables), reuse (copy), and share (publish) prompts. Nothing-inspired dot-matrix identity, light-only strict monochrome, no hues, no gradients, no dark mode.

## Stack

- Next.js 16.4 (App Router, `cacheComponents`, Turbopack) + React 19 + TypeScript
- Tailwind v4 (`@theme` tokens in `src/app/globals.css`)
- Firebase Auth + Firestore (with an honest local-browser fallback adapter)
- `lucide-react` icons; fonts via `next/font/google` (Schibsted Grotesk, Archivo, IBM Plex Mono)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npx tsc --noEmit
```

## Backends — read this

The app resolves its data backend at runtime (`src/lib/backend.ts`):

1. **Firebase (live)** — used when Firebase is configured *and* the Email/Password provider is enabled.
2. **Local browser adapter** — the fallback. Everything is stored in `localStorage`, seeded with a demo account, 10 public prompts from synthetic authors, 6 own prompts, 3 collections, favorites, and recents. New sign-ups get an empty library so empty states are real.

A visible banner in the app tells you which backend is active. There is no hidden fallback and no fake success.

### Switching to live Firebase

Your Firebase project (`prompt-labs-5aaf9`) is already wired in `.env.local`, and the Firestore rules + indexes are already deployed. One **console-only** step remains (it cannot be done from the client SDK):

1. Open [Firebase console → Authentication → Sign-in method](https://console.firebase.google.com/project/prompt-labs-5aaf9/authentication/providers).
2. Enable **Email/Password**. Save.
3. Reload the app. Auth now goes through Firebase; the local banner disappears.

Until that step is done, sign-in/sign-up run against the local adapter and the banner stays.

### Demo account (local backend)

- Email: `demo@promptlabs.app`
- Password: `demo1234`

The sign-in page has a "Fill demo credentials" button.

### Honest limitations

- **Local mode is per-browser.** Clearing site data or switching devices starts you fresh. Export (Settings → Export everything as JSON) before switching.
- **Seeded public prompts are synthetic.** They exist only in the local adapter so Explore is not empty. They are clearly demo content, not real people.
- **Search is keyword-only.** Title, description, tags, category, body. No semantic/AI ranking — the UI never implies otherwise.
- **Variables are non-destructive.** The fill workspace substitutes into a preview and a copy buffer; the saved template is never modified.
- **Private by default.** Publishing is an explicit action; server rules (`firestore.rules`) keep private prompts readable only by their owner.

## Product truth

See `PRODUCT.md` for the durable product commitments this build holds to. `DESIGN.md` records the visual system. Design-surface brief: `.impeccable/surfaces/src-app.md`.

## App structure

- `src/app/(auth)/` — sign-in, sign-up, password reset
- `src/app/(app)/` — home, library, prompt editor (new/edit), prompt detail, fill workspace, search, explore, collections, favorites, settings
- `src/lib/backend.ts` — backend resolution + `Backend` interface
- `src/lib/adapters/` — `firebase-adapter.ts`, `local-adapter.ts`
- `src/lib/store.tsx` — client state (auth, prompts, collections, favorites, recents, toasts)
- `src/components/dots/` — dot-matrix primitives (wordmark, halftone, loader, field, mark)
- `src/components/prompt/`, `src/components/ui/`, `src/components/shell/` — feature and UI components
- `firestore.rules`, `firebase.indexes.json`, `firebase.json` — deployed Firestore config

## What ships working

All 12 screens and the full journeys: sign up / sign in / reset, create / edit / delete prompts, detect and fill `{{variables}}` against a live preview, copy completed output, favorite, organize into collections, search and filter, explore public prompts and save an independent copy, publish / unpublish, export data, delete account. Verified end-to-end with Playwright (16/16 journeys passing, desktop + mobile).

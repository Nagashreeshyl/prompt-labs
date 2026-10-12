---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief — Prompt Labs application

Mode: Operate. This is a working tool: personal prompt library + public discovery. Every route is a job surface, not a marketing page.

## Scope

Whole application (all 12 screens): auth (sign-in, sign-up, reset), home dashboard, my library, prompt editor (create/edit), prompt detail, variable-filler workspace, search, explore + public detail, collections, favorites/recent, settings/account. Code-led build (Operate surface; no image generation in harness).

## Audience, job, action, proof

Audience: students, developers, researchers, writers, AI-curious professionals managing reusable AI prompts.
Job: capture, organize, discover, customize (variables), reuse (copy), share (publish) prompts.
Primary actions: New Prompt, global search, open → fill variables → copy, publish/unpublish, save-a-copy from Explore.
Proof: real seeded prompt content with realistic bodies and variables; every control does what it says (copy actually copies; publish actually flips visibility; save-a-copy creates an independent private prompt).

## Constraints

Light theme only, strictly monochrome (no hues, no gradients, no dark mode). Nothing-inspired dot-matrix identity, original (no Nothing assets). Keyword search only — never imply semantic/AI search. Variables non-destructive. Private by default. WCAG 2.2 AA. Free-tier compatible (no paid AI APIs).

## Direction contract

THESIS: Prompt Labs is a precision instrument for reusable prompt text — the library is the product, and the dot-matrix is the grammar of structure (density codes hierarchy, dot fields mark state and identity), never wallpaper. It refuses the category default of colorful AI-dashboard card grids, gradient hero sheen, and chart decoration on a tool whose value is text.

OWN-WORLD: Pure monochrome. Ground #FFFFFF, ink #000000, secondary #555555, muted #767676 (AA-corrected from the brief's #777777), surfaces #F5F5F5 / #EEEEEE, hairlines #DCDCDC, strong rules 1px #000000. Corners 2px, borders hairline, shadows essentially absent. Type in three voices: Schibsted Grotesk (display/headings, 600–800, tight tracking), Archivo (body/UI, 400–600), IBM Plex Mono (IDs, timestamps, counts, variable names, shortcuts — data only, never costume). Spacing on a 4px rhythm; dense inside groups, generous between. The dot system is a parameterized primitive family (dot size, pitch, density, formation) used for: the wordmark, section markers, empty-state halftones, loaders, and metadata ticks — banned behind body text, inputs, and nav labels.

STORY: The user arrives at a working library. They scan mono-ticked rows, search instantly, open a prompt, fill its variables against a live preview, copy clean text, and — when ready — publish it to a public shelf where others save independent copies. What they understand in one session: this is my library, my prompts are templates with slots, nothing I fill in mutates the original.

FIRST VIEWPORT: Desktop shell = fixed left rail (dot-matrix wordmark, nav: Home, Library, Explore, Collections, Favorites; solid black "New prompt" button; footer: account + backend status). Main column: mono page marker + count, page title in display face, hairline rule, then the working surface (rows, not card grids). Search is global from a ⌘K-style command field in the top bar. Mobile: compact top bar + bottom nav, same tokens.

FORM: Code-led Operate build. Seed key: none printed — the user brief pinned the direction, which beats the roll; concept-seed was not run and mode-operate.md governs.

Signature moment: the variable-fill workspace — a prompt body whose {{slots}} render as dot-matrix chips that fill in live against a full-height preview, with the original template visibly intact beside it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Firebase Email/Password provider must be enabled in the Firebase console (API-enforced, console-only action). Until then the app runs the local adapter with a visible, honest status banner.
- Live-mode seeding of other authors' public prompts requires either the provider being enabled or an admin import; the local adapter ships full synthetic seed content for demo.

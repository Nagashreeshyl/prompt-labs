# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS + Firebase Authentication + Cloud Firestore. Free-compatible deployment target. User confirmed real Firebase project `prompt-labs-5aaf9` (web config provided, written to `.env.local`). A local adapter backs the same interface when Firebase is unconfigured or unreachable so the UI remains testable.

## Users

Students, developers, AI enthusiasts, researchers, writers, and professionals who reuse AI prompts often enough to want a managed library rather than a notes app or chat history.

## Product Purpose

Prompt Labs is a personal prompt manager plus a public prompt discovery library. It makes saving, organizing, searching, customizing (via variables), reusing (copy clean text), and sharing (publish with independent copies) prompts feel as organized as a personal knowledge library and as fast as a search tool. Success: a user finds the right prompt, customizes it, reuses it, and shares it without touching the original template.

## Positioning

Prompts are reusable templates, not chat messages. The differentiating mechanism: variable filling (`{{variable_name}}`) that never mutates the source template, plus controlled public publishing where other users save independent copies rather than linking to the original.

## Operating Context

Personal knowledge-management workflows: capture while working, organize into collections and tags, search by keyword, fill variables at the moment of reuse, copy to clipboard, publish selectively. Sessions are frequent, short, and task-focused.

## Capabilities and Constraints

- Six pillars: Capture, Organize, Discover, Customize, Reuse, Share.
- Keyword search only (title, description, tags, category, body). No semantic/typo-tolerant search claims.
- Variable syntax `{{variable_name}}`, detected client-side, substitution is non-destructive.
- Collections are private; each prompt belongs to at most one collection (MVP).
- Every new prompt is private; publishing requires explicit confirmation; unpublish does not erase copies saved by others.
- Save a Copy creates a new independent prompt (new ID, private, source attribution preserved).
- Only owners may edit, delete, publish, unpublish. Enforced by Firestore security rules, not just UI.
- Favorites and recent-access state are personal and never stored on shared public prompt documents.
- Export own data as JSON. Account deletion with confirmation.
- No AI APIs required; the product is fully usable without them.
- Assumed (marked as inference, from brief): email/password auth only; single-user-per-account; no real-time collaboration.

## Brand Commitments

- Name: Prompt Labs.
- Core promise: Find the right prompt. Customize it. Reuse it. Share it.
- Visual identity is pinned by the user brief: light theme only, strictly monochrome (white/black/neutral grays, no hues at all), Nothing-Phone-inspired dot-matrix graphic language used as a structural design system element, precise technical typography, engineered/editorial feel. No dark mode, no colorful accents, no gradients.
- Do not copy Nothing's branding, logos, proprietary assets, or exact interfaces — original Prompt Labs identity using similar principles.
- Voice: direct, confident, technical, uncluttered.

## Evidence on Hand

No real user content or brand assets exist. All demo prompts, authors, and collections shipped in seed data are synthetic and authored for this build; they must not be presented as real user testimonials or usage metrics. No invented popularity metrics, ratings, or review counts anywhere.

## Product Principles

1. Content first — prompt text is the hero; chrome recedes.
2. Non-destructive reuse — filling variables and saving copies never mutate sources.
3. Honest capability surfaces — the UI never promises search, sharing, or sync behavior the implementation does not have.
4. Private by default — publishing is an explicit, explained act.
5. Precision over decoration — every graphic element earns its place (dot-matrix carries structure and identity, never noise).

## Accessibility & Inclusion

WCAG 2.2 AA: sufficient text/control contrast in a monochrome system, labeled fields, keyboard-operable essential actions, visible focus, screen-reader support, status announced without relying on color, large enough touch targets, reduced-motion respected.

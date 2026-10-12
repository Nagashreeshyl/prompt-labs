---
name: Prompt Labs
description: Precision monochrome instrument for reusable AI prompts — dot-matrix grammar, light-only, text-first.
colors:
  canvas: "#ffffff"
  surface: "#f5f5f5"
  surface-2: "#eeeeee"
  ink: "#000000"
  ink-2: "#555555"
  ink-3: "#767676"
  line: "#dcdcdc"
  line-strong: "#000000"
  disabled: "#9a9a9a"
  disabled-bg: "#eeeeee"
typography:
  display:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
    lineHeight: 1.15
  body:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.xs}"
    padding: "0 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0 14px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    height: "36px"
    padding: "0 12px"
  chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.xs}"
---

# Design System: Prompt Labs

## Overview

**Creative North Star: "The Precision Instrument"**

Prompt Labs is a working tool, not a showcase. Its personality is disciplined monochrome utility: pure white ground, black ink, hairline structure, and a dot-matrix vocabulary borrowed from dot-matrix printing and Nothing's dot-matrix design language. The aesthetic refuses the category default of colorful AI-dashboard card grids, gradient hero sheen, and chart decoration on a tool whose value is text.

Everything is built on a 4px rhythm with dense interior grouping and generous exterior separation. Corners are barely rounded (2px), borders are hairline, and shadows are essentially absent except for dialogs. The dot system is a parameterized primitive family — never wallpaper behind body text, inputs, or navigation labels.

**Key Characteristics:**
- Strict monochrome, light-only; no hues, no gradients, no dark mode
- Dot-matrix as grammar of structure, not decoration
- Rows over cards; text over imagery
- Three type voices: display grotesk, body sans, data mono
- WCAG 2.2 AA contrast throughout

## Colors

Pure monochrome. Value and context carry all meaning; hue is banned.

### Primary
- **Ink** (#000000): Primary text, strong rules, primary button fill, active nav background, selection highlight, focus rings, filled variable chips in preview.

### Neutral
- **Canvas** (#ffffff): Page ground, input backgrounds, button text on ink, card interiors.
- **Surface** (#f5f5f5): Hover states, subtle panel fills, sidebar footer.
- **Surface-2** (#eeeeee): Pressed states, disabled backgrounds, backend banner.
- **Ink-2** (#555555): Secondary body text, descriptions, chip text.
- **Ink-3** (#767676): Muted metadata, timestamps, placeholders, helper text. (AA-corrected from brief's #777777.)
- **Line** (#dcdcdc): Hairline borders, dividers, input strokes, scrollbar thumb.
- **Disabled** (#9a9a9a): Disabled control text.
- **Disabled-bg** (#eeeeee): Disabled control fill.

### Named Rules
**The Monochrome Rule.** No hue enters the system. Emphasis comes from weight, size, or ink/canvas inversion — never color.

**The Line Rule.** Structure is drawn with 1px hairlines (#dcdcdc) and strong rules (1px #000000). Never thicker than 1px except the 2px focus ring.

## Typography

**Display Font:** Schibsted Grotesk (with Helvetica Neue, Helvetica, Arial fallback)
**Body Font:** Archivo (with Helvetica Neue, Helvetica, Arial fallback)
**Mono Font:** IBM Plex Mono (with ui-monospace, SF Mono, Menlo fallback)

**Character:** A tight, confident grotesk display paired with a neutral, highly legible body sans and a technical mono reserved strictly for data. The mono is a costume only when it labels something that is not code, measurement, or identifier.

### Hierarchy
- **Display** (700, 28–40px clamp, 1.15, -0.02em): Page titles, section anchors. Balanced wrap (`text-wrap: balance`).
- **Headline** (600–700, 16–19px, 1.25): Card titles, list-item titles, modal titles.
- **Body** (400, 15px, 1.55): Paragraphs, descriptions, form help. Max measure 65–75ch.
- **Small** (400, 13–13.5px, 1.45): Row descriptions, secondary lines.
- **Mono-data** (400, 11–13px, 1.4, tabular-nums): Timestamps, counts, IDs, handles, variable names, shortcuts, backend status. Always `font-variant-numeric: tabular-nums`.

### Named Rules
**The Mono Rule.** Mono type is for data and measurement only — IDs, timestamps, counts, handles, variable placeholders, keyboard shortcuts, status codes. Never for headings, buttons, or body prose.

## Layout

Fixed left rail (236px) on desktop ≥1024px: dot-matrix wordmark, solid black "New prompt" button, search field with ⌘K hint, nav list (Home, Library, Explore, Collections, Favorites) with active item inverted to ink, footer with backend status dot and account. Main column max-width 1180px, padding 32px horizontal / 40px top on desktop.

Mobile <1024px: compact top bar (wordmark, search icon, add button), bottom tab bar (Home, Library, Explore, Collections, Favorites) with active state inverted. Content padding 16px horizontal, bottom padding 112px to clear the tab bar.

Page structure: mono metadata line (count, status), display title, hairline rule (`border-top: 1px solid #000000`), then working surface. Rows, not card grids.

**Spacing rhythm:** 4px base. Dense inside groups (8–16px), generous between sections (32–48px). More space above a heading than below it.

## Elevation & Depth

Flat by default. Surfaces sit directly on the canvas with hairline borders; there is no resting shadow on cards, rows, or inputs. Depth is reserved for temporary overlays.

### Shadow Vocabulary
- **Dialog** (`0 24px 48px -12px rgb(0 0 0 / 0.18), 0 0 0 1px #000000`): Modals and confirm dialogs only. The 1px ink ring keeps the monochrome discipline even in elevation.

### Named Rules
**The Flat-By-Default Rule.** Nothing casts a shadow at rest. Shadows appear only on dialogs — elements that must lift off the working surface to demand a decision.

## Shapes

Corners are barely softened: 2px (`--radius-xs`) for buttons, inputs, chips, nav items, tags; 3–4px for larger panels and dialogs. Borders are 1px hairline (#dcdcdc) at rest, 1px ink (#000000) when active or strong. Clipping is square; no pills, no blobs, no ornamental geometry. The only circular forms are the dot primitives and the avatar monogram.

## Components

### Buttons
- **Shape:** 2px radius, 36px height (md), 30px (sm), 42px (lg).
- **Primary:** Ink fill (#000000), canvas text, 1px ink border. Hover: #1a1a1a. Active: inverts to canvas fill / ink text.
- **Secondary:** Canvas fill, ink text, 1px ink border. Hover: surface (#f5f5f5).
- **Ghost:** Transparent, ink text, no border. Hover: surface.
- **Danger:** Canvas fill, ink text, 1px ink border. Hover: inverts to ink fill / canvas text.
- **Focus:** 2px ink outline, 2px offset (`:focus-visible`).

### Chips / Tags
- **Style:** Canvas fill, ink-2 text, 1px line border, 2px radius, 2px×8px padding, mono or body 12px.
- **Active/filter:** Ink fill, canvas text.
- **Variable chips (fill workspace):** Filled slots render as ink blocks with canvas text; empty slots render as dashed ink borders.

### Cards / Containers
- **Corner Style:** 2px radius.
- **Background:** Canvas or surface-2 depending on context.
- **Border:** 1px line (#dcdcdc) at rest; 1px ink for emphasis panels.
- **Shadow Strategy:** None at rest (see Elevation).
- **Internal Padding:** 20–24px.

### Inputs / Fields
- **Style:** Canvas fill, ink text, 1px line border (#dcdcdc), 2px radius, 36px height (md) / 44px (lg).
- **Focus:** 1px ink border + 2px ink outline (2px offset).
- **Error:** 1px ink border + inline error text below in ink, 12.5px.
- **Disabled:** surface-2 fill, disabled text (#9a9a9a).

### Navigation
- **Desktop rail:** Body 14px, ink-2 text, 2px radius items. Active: ink fill, canvas text. Hover: surface fill.
- **Mobile tab bar:** Icon + 11px label. Active: ink fill pill behind icon+label.

### Dot Primitives (signature)
Parameterized dot fields (`DotField`, `Halftone`, `DotMark`, `DotLoader`, `DotLogo`) built from CSS radial-gradient patterns with configurable dot size (1–3px), pitch (5–14px), density, and formation. Used for: wordmark, empty-state halftones, section markers, loading states, metadata ticks, backend status. **Banned** behind body text, inputs, and navigation labels.

## Do's and Don'ts

### Do:
- **Do** keep every surface pure monochrome — ink (#000000) on canvas (#ffffff) with ink-2 (#555555) and ink-3 (#767676) for secondary and muted text.
- **Do** structure pages with hairline rules (1px #dcdcdc) and strong rules (1px #000000), not shadows or cards.
- **Do** use IBM Plex Mono for data and measurement only: timestamps, counts, IDs, handles, variable names, shortcuts, backend status.
- **Do** render the dot-matrix system as grammar — wordmark, empty states, loaders, status dots — never as wallpaper behind readable text.
- **Do** invert to ink fill / canvas text for active nav items, filled variable chips, and selection.
- **Do** maintain 2px radius on controls; hairline borders at rest.
- **Do** theme browser surfaces: selection (ink/canvas), caret, focus rings (2px ink outline, 2px offset), scrollbars (line thumb on canvas track).

### Don't:
- **Don't** introduce any hue, gradient, or dark mode. The system is light-only and strictly monochrome.
- **Don't** use monospace for headings, buttons, or body prose — it is a data voice, not a costume.
- **Don't** build pages from same-size cards of icon + heading + text. Use rows and hairline-ruled lists.
- **Don't** put a kicker or eyebrow above a heading. The heading carries its own weight.
- **Don't** use hard offset shadows (`box-shadow: 4px 4px 0`) — the world is flat, not neobrutalist.
- **Don't** place dot-matrix fields behind body text, inputs, or navigation labels.
- **Don't** exceed 1px border width except the 2px focus ring.
- **Don't** invent metrics, ratings, or social proof. Every number shown is a real count of the user's own data.

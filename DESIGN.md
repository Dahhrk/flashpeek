# Flashpeek — Design

**Named direction: Lobby Plate**

## Tokens

| Role | Value |
|---|---|
| field | `#1a1d22` |
| raised | `#242830` |
| hairline | `#353b45` |
| ink | `#e8eaed` |
| muted | `#8b919a` |
| accent | `#e8a317` |
| danger | `#c44b4b` |
| success | `#3d9a6a` |

## Typography

| Role | Family | Weight |
|---|---|---|
| Brand / headings | Archivo Narrow | 700 |
| Body / UI | IBM Plex Sans | 400, 500 |
| Data / mono | IBM Plex Mono | 400 |

## Density & radius

- Base unit: 4 px.
- Padding: 8–16 px on interactive elements.
- Border-radius: 4 px (inputs, buttons, plates). No pill shapes.
- Hairline borders: 1 px solid `hairline`.

## Motion

- Transitions: 120 ms ease-out on interactive feedback (hover, focus).
- No decorative animation. No spring physics. No page-transition choreography.

## Composition

- **Search-first**: the home screen is a search field, not a marketing page.
- **Roster plates**: live-game views are dense horizontal rows, not card grids.
- **No 3-card hero**: no hero sections with three feature cards.
- Surfaces are `raised` plates on a `field` background separated by `hairline` borders.

## Contaminants (banned)

- Inter font
- Purple accent palette (`#7c3aed`, `#8b5cf6`, etc.)
- Card grids / 3-card hero layouts
- Nightglass (dark + grain + neon mint)
- Gradient hero blobs
- "Get Started" / "Learn More" button copy
- Pill-radius buttons or inputs
- Decorative grain texture overlays
- Spring/bounce motion
- Marketing landing page patterns

## MVP out of scope

- Premier Live Game companion (Phase 2 — see PHASE2.md)
- Native/desktop app
- Marketing landing page

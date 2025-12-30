# Design System Editor

A Vite + React playground for building and exporting a design system. Includes type scale tooling, component state previews, and export helpers.

## Features
- Type scale builder with web font loader, resizable specimens/settings, and inline inspector.
- Component previews with per-state controls; list item supports dividers, stack gaps, and tokenized colors.
- Shape controls aligned across components (radius, shadow, border style/width).
- Exportable tokens and components JSON/CSS under `exports/`.

## Getting started
1. **Node**: Use Node 18+.
2. **Install deps**: `npm install`
3. **Run dev server**: `npm run dev`
4. Open the printed URL (default `http://localhost:5173`).

## Scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – production build.
- `npm run preview` – preview the production build locally.
- `npm run test` – run vitest.

## Project notes
- Exports live in `exports/` (tokens and components JSON/CSS) and are git-tracked.
- State visuals use neutral wrappers so only component tokens affect the component itself.
- The Type Scale page includes a visible resize handle between specimens and settings.

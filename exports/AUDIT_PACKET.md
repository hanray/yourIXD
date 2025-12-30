# Audit Packet

## 0) What the app does
A browser-based design system workbench where you edit global tokens (color, typography, motion, spacing, etc.) and per-component tokens/contracts, see live previews (default vs inverse), and export the current snapshot as tokens.json, components.json, and tokens.css. Snapshots are saved/loaded from localStorage, letting you clone, replace, or reset the active system.

## 1) Repo map (≤3 levels) + sources of truth
- Tree: see tree.txt (generated) for full 3-level view.
- Key files:
  - Token model + schema: [src/models/designSystem.ts](src/models/designSystem.ts)
  - Token defaults: [src/data/defaults.ts](src/data/defaults.ts)
  - Component contracts model: [src/models/designSystem.ts](src/models/designSystem.ts)
  - Component contracts defaults: [src/data/defaults.ts](src/data/defaults.ts)
  - State/store (actions, snapshot lifecycle): [src/state/store.ts](src/state/store.ts)
  - Persistence (localStorage): [src/state/persistence.ts](src/state/persistence.ts)
  - Live preview renderer: [src/components/editor/LivePreview.tsx](src/components/editor/LivePreview.tsx)
  - Component preview grid: [src/components/preview/ComponentPreview.tsx](src/components/preview/ComponentPreview.tsx)
  - Exporters: [src/utils/exporters/tokensJson.ts](src/utils/exporters/tokensJson.ts), [src/utils/exporters/componentsJson.ts](src/utils/exporters/componentsJson.ts), [src/utils/exporters/tokensCss.ts](src/utils/exporters/tokensCss.ts), [src/utils/exporters/fullExport.ts](src/utils/exporters/fullExport.ts)

## 2) Data flow (5–10 bullets each)
- Edit token on Theme page → store update → preview update:
  - UI triggers `updateGlobalToken(path, value)` from [src/state/store.ts](src/state/store.ts) via ThemeSettingsPage controls.
  - Store clones globals, applies `setDeep`, coerces numbers, sets updatedAt, and `persistence.save` writes to localStorage.
  - `useDesignSystem` state updates; `LivePreview`/`TypeScalePage` subscribe and recompute styles using snapshot.globals; UI rerenders.
- Edit component override → store update → preview update:
  - UI (ComponentPage) calls `updateComponentTokens(componentId, target, key, tokens)` in [src/state/store.ts](src/state/store.ts).
  - Store clones snapshot, merges base/state/variant tokens, stamps updatedAt, saves to localStorage.
  - `LivePreview` recomputes merged tokens (`mergeTokens` + `tokensToStyle`) and rerenders with new state/variant selection.
- Save snapshot:
  - ThemeSettingsPage invokes `saveSnapshot({ name, description })` in [src/state/store.ts](src/state/store.ts).
  - Store clones current snapshot, assigns new id/name/timestamps, persists via `persistence.save`, replaces in state, fires toast.
- Load snapshot (replace active system):
  - ThemeSettingsPage calls `loadSnapshot(id)`.
  - Store loads from `persistence.load`, clones into state, resets selectedSection to "theme", clears dirty, fires toast.
- Export tokens.json:
  - `useExports` builds `tokensJson` by `buildTokensJson(snapshot)` in [src/utils/exporters/tokensJson.ts](src/utils/exporters/tokensJson.ts) (globals + component token overrides).
- Export components.json:
  - `useExports` builds `componentsJson` via `buildComponentsJson(snapshot)` in [src/utils/exporters/componentsJson.ts](src/utils/exporters/componentsJson.ts) (contracts + token overrides, states, variants, slots).
- Export tokens.css:
  - `useExports` builds `tokensCss` via `buildTokensCss(snapshot)` in [src/utils/exporters/tokensCss.ts](src/utils/exporters/tokensCss.ts) (flattens globals to CSS custom properties under :root).

## 3) Token schema (actual)
- Default tokens.json excerpt (from [exports/tokens.json](exports/tokens.json)):
```json
{
  "globals": {
    "color": {
      "surface": {"base": "#f8f9fb", "subtle": "#f0f2f6", "elevated": "#ffffff", "inverse": "#0f172a"},
      "text": {"primary": "#0f172a", "secondary": "#1f2937", "muted": "#475569", "inverse": "#f8fafc", "disabled": "rgba(15, 23, 42, 0.35)"},
      "border": {"default": "#e2e8f0", "subtle": "#edf2f7", "focus": "#0f62fe", "danger": "#b91c1c"},
      "accent": {"primary": {"base": "#0f62fe", "hover": "#0d55dc", "active": "#0b49c3", "contrast": "#ffffff"}},
      "danger": {"base": "#b91c1c", "hover": "#9f1a1a", "active": "#861616", "contrast": "#ffffff"}
    },
    "font": {"family": {"sans": "SF Pro Text, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", "serif": "Georgia, 'Times New Roman', serif", "mono": "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace"}, "size": {"1": "14px", "2": "16px", "3": "18px", "4": "20px", "5": "24px", "6": "28px"}},
    "textRole": {"display": {"size": "font.size.6", "weight": "weight.semibold", "lineHeight": "lineHeight.relaxed"}, "heading": {"size": "font.size.5", "weight": "weight.semibold", "lineHeight": "lineHeight.normal"}, "subheading": {"size": "font.size.4", "weight": "weight.medium", "lineHeight": "lineHeight.normal"}, "body": {"size": "font.size.2", "weight": "weight.regular", "lineHeight": "lineHeight.normal"}, "caption": {"size": "font.size.1", "weight": "weight.regular", "lineHeight": "lineHeight.tight"}, "label": {"size": "font.size.1", "weight": "weight.medium", "lineHeight": "lineHeight.tight"}},
    "lineHeight": {"tight": "1.25", "normal": "1.5", "relaxed": "1.65"},
    "weight": {"regular": 400, "medium": 500, "semibold": 600, "bold": 700},
    "space": {"0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px"},
    "radius": {"none": "0px", "sm": "6px", "md": "10px", "lg": "14px", "full": "999px"},
    "shadow": {"none": "none", "sm": "0 1px 2px rgba(0,0,0,0.04)", "md": "0 10px 30px rgba(0,0,0,0.06)", "lg": "0 20px 40px rgba(0,0,0,0.10)"},
    "motion": {"duration": {"fast": "120ms", "normal": "200ms", "slow": "320ms"}, "easing": {"standard": "cubic-bezier(0.4, 0.0, 0.2, 1)", "emphasized": "cubic-bezier(0.2, 0.0, 0.0, 1)"}, "loading": {"color": "#e7f0ff", "defaultPreset": "skeleton", "presets": {"skeleton": {"kind": "skeleton", "color": "#e7f0ff"}, "progress": {"kind": "progress", "color": "#0f62fe"}, "dots": {"kind": "dots", "color": "#0f62fe"}}}}
  }
}
```
- Keys are nested objects; references use dotted strings (e.g., "font.size.6") rather than dotted object keys. 
- Inverse handling: dedicated `color.surface.inverse` and `color.text.inverse`, used by `LivePreview` polarity toggle and themes.

## 4) Component contracts schema (actual)
- Shape: `ComponentSpec { id, label, contract { anatomy, semantics, variants[], states{}, requiredStates[], forbiddenOverrides[] }, baseTokens, states?, variants?, slots? }` defined in [src/models/designSystem.ts](src/models/designSystem.ts); defaults in [src/data/defaults.ts](src/data/defaults.ts).
- Button (id button):
  - Contract anatomy: paddingX `space.4`, paddingY `space.2`, gap `space.2`, radius `radius.md`, borderWidth `1px` (literal allowed).
  - Semantics: bg/text/border/shadow tokens; variants include size sm/md/lg (token overrides), intents primary/secondary, style ghost.
  - States: default, hover, active, focus, disabled, loading, selected with token overrides allowed; requiredStates includes all.
  - Overrides token-only expected for color/shadow/radius/spacing; literals allowed where defaults are literals (borderWidth, motion durations if provided).
- Input (id input):
  - Anatomy: paddingX `space.3`, paddingY `space.2`, gap `space.1`, radius `radius.md`, borderWidth `1px`.
  - Semantics: bg/text/border/shadow tokens; variants sm/md/lg, intent primary/error.
  - States: default, hover, active, focus, disabled, loading, selected, error; forbiddenOverrides borderRadiusCustom, boxShadowCustom.
  - Tokens are expected to be token references; literals allowed for widths/styles.
- Nav (id navbar):
  - Anatomy: paddingX `space.6`, paddingY `space.3`, gap `space.3`, radius `radius.md`, borderWidth `1px`.
  - Semantics: bg/text/border/shadow tokens; variants default, inverse (bg surface.inverse, fg text.inverse).
  - States: default, hover, active, focus, disabled, loading, selected (all empty by default).
  - Tokens mostly token references; literal borderWidth allowed.

## 5) Export output samples (same snapshot)
- Generated from default snapshot via build exporters (already written):
  - tokens.json: [exports/tokens.json](exports/tokens.json)
  - components.json: [exports/components.json](exports/components.json)
  - tokens.css: [exports/tokens.css](exports/tokens.css)
- All three come from the same `defaultSnapshot()` run, so keys/values are consistent across JSON and CSS variables.

## 6) Figma integration reality
- Do you currently export Figma Tokens/Variables format? **No.** There is a helper `exportFigmaVariablesJson` in [src/utils/exporters/fullExport.ts](src/utils/exporters/fullExport.ts), but it is not wired into UI/exports.
- Planned/available method: leverage CSS variables or the unused `exportFigmaVariablesJson` to produce a variables JSON; Tokens Studio import is not currently implemented; manual mapping via CSS variables is the realistic path.
- Intended mapping: global tokens → Figma Variables (colors, space, radius, size, weight); text styles likely remain manual until styles export is added.

## 7) MCP obedience (instructions to give MCP)
- Exports live in `exports/` (tokens.json, components.json, tokens.css). MCP should read from there only.
- Components must consume tokens through CSS custom properties (see tokens.css); no hardcoded values; no creating new tokens.
- Use existing token references; for component-level values, use `var(--token-path)` aliases that already exist.
- Forbidden: introducing literals where a token exists, creating new tokens, bypassing inverse handling.
- Inverse contexts: honor `data-theme="inverse"` or polarity toggles by swapping to inverse surface/text tokens; do not hardcode dark values.

## 8) Known issues (short, honest)
- Missing dependency `jszip` caused Vite import resolution failure in ExportModal; fixed by installing jszip 3.10.1 (no code change).
- Form fields sometimes momentarily clear while applying updates (ThemeSettings/ComponentPage) because inputs normalize values while store writes; values still persist.
- Preview state visibility: LivePreview only shows one state/variant at a time; multi-state comparison requires ComponentPreview grid, which doesn’t cover all components.
- Navbar/Avatar previews are minimal and may not reflect real-world layout semantics (no nav items/avatar initials), so visual fidelity is limited.
- Inverse preview relies on token swap only; component-level inverse variants may be absent, so some elements look identical in inverse mode.

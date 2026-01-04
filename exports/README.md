# Orion Design System (tokens + components)

Apply by wrapping your app (or a subtree) with `data-theme="orion"`, then load the token sheet first and the component sheet second:

```html
<link rel="stylesheet" href="/exports/tokens.css" />
<link rel="stylesheet" href="/exports/components.css" />
<body data-theme="orion">...</body>
```

## Foundation
- Spacing scale: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 (tokens `--space-0` … `--space-10`).
- Radius scale: 0, 6, 10, 16, 24, pill (999px).
- Typography: role tokens for display, heading, title, body, caption, label with line-heights baked in.
- Borders: `--border-width-1/2/3`, focus ring (`--focus-ring-color`, `--focus-ring-width`, `--focus-ring-offset`).
- Shadows: xs/sm/md/lg/overlay tuned for elevation.
- Icons: `--icon-size-sm/md/lg/xl`, `--icon-stroke`.

## Vertical rhythm
- Stack gaps: `--rhythm-stack-xs/sm/md/lg/xl`.
- Sections: `--rhythm-section` (40px) and `--rhythm-section-lg` (48px).
- Forms: `--rhythm-form-field` (12px), `--rhythm-form-group` (20px), label gap 4px.
- Headings: `--rhythm-heading-gap` between heading and following content.
- Tables: `--component-table-cell-padding-y/x` for consistent grid rhythm.

## Component defaults (token-bound)
- Buttons: padding uses spacing scale, min heights set, variants `primary/secondary/ghost/danger`, focus + hover + active baked in.
- Inputs/selects/textareas: padded controls, focus rings, disabled/error styling, control height tokenized.
- Cards/panels: internal padding (`--component-card-padding`), header/body spacing, shadow + radius tokens.
- Tables: row/cell padding, header background, hover rows, rounded container.
- Modals: overlay color, dialog padding, radius xl, overlay shadow, header/footer layout.
- Alerts/badges: semantic palettes, internal gaps, icon support.
- Tabs/navigation: bottom border, active tab treatment, hover feedback.
- Lists: vertical gap and bullet alignment.
- Page framing: header/footer defaults, section spacing, `.ds-page` vertical rhythm.

## Override strategy
- Everything scopes to `[data-theme="orion"]` so you can layer this atop existing apps without clashing.
- Swap themes by duplicating `tokens.css` under a new data-theme value; `components.css` will pick up whichever token set is active.

## Icon support
Use `.ds-icon` (and size modifiers) to align SVG or font icons with text and controls. Tokens define size and stroke width for consistent rendering.

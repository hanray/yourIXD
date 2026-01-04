import { DesignSystemSnapshot, Globals, ComponentTokens } from "@models/designSystem";

/**
 * Resolve token reference to its actual value
 */
const resolveToken = (path: string, globals: Globals): any => {
  if (!path || typeof path !== "string") return path;
  if (!path.includes(".")) return path;
  
  const parts = path.split(".");
  let current: any = globals;
  
  for (const part of parts) {
    if (current == null) return path;
    current = current[part];
  }
  
  return current != null ? current : path;
};

/**
 * Recursively resolve all token references in an object
 */
const resolveAllTokens = (obj: any, globals: Globals): any => {
  if (obj == null) return obj;
  
  if (typeof obj === "string") {
    return resolveToken(obj, globals);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveAllTokens(item, globals));
  }
  
  if (typeof obj === "object") {
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveAllTokens(value, globals);
    }
    return resolved;
  }
  
  return obj;
};

/**
 * Export tokens.json with resolved values
 */
export const exportTokensJson = (snapshot: DesignSystemSnapshot): string => {
  const resolved = {
    name: snapshot.name,
    description: snapshot.description,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    globals: snapshot.globals,
    computed: {
      // Resolved color tokens
      color: resolveAllTokens(snapshot.globals.color, snapshot.globals),
      // Resolved font tokens
      font: resolveAllTokens(snapshot.globals.font, snapshot.globals),
      // Resolved text role tokens
      textRole: resolveAllTokens(snapshot.globals.textRole, snapshot.globals),
      // Other resolved tokens
      lineHeight: snapshot.globals.lineHeight,
      weight: snapshot.globals.weight,
      space: snapshot.globals.space,
      radius: snapshot.globals.radius,
      shadow: snapshot.globals.shadow,
      motion: snapshot.globals.motion,
    }
  };
  
  return JSON.stringify(resolved, null, 2);
};

/**
 * Export components.json with contracts and overrides
 */
export const exportComponentsJson = (snapshot: DesignSystemSnapshot): string => {
  const components: Record<string, any> = {};
  
  for (const [id, spec] of Object.entries(snapshot.components)) {
    const resolvedBase = resolveAllTokens(spec.baseTokens, snapshot.globals);
    const resolvedStates: Record<string, any> = {};
    
    if (spec.states) {
      for (const [stateName, stateTokens] of Object.entries(spec.states)) {
        resolvedStates[stateName] = {
          tokens: stateTokens,
          resolved: resolveAllTokens(stateTokens, snapshot.globals),
        };
      }
    }
    
    const resolvedVariants: Record<string, any> = {};
    if (spec.variants) {
      for (const [variantName, variantTokens] of Object.entries(spec.variants)) {
        resolvedVariants[variantName] = {
          tokens: variantTokens,
          resolved: resolveAllTokens(variantTokens, snapshot.globals),
        };
      }
    }
    
    components[id] = {
      id: spec.id,
      label: spec.label,
      contract: {
        anatomy: spec.contract.anatomy,
        semantics: spec.contract.semantics,
        variants: spec.contract.variants,
        requiredStates: spec.contract.requiredStates,
        forbiddenOverrides: spec.contract.forbiddenOverrides,
      },
      baseTokens: spec.baseTokens,
      baseResolved: resolvedBase,
      states: resolvedStates,
      variants: resolvedVariants,
      slots: spec.slots ? {
        tokens: spec.slots,
        resolved: resolveAllTokens(spec.slots, snapshot.globals),
      } : undefined,
    };
  }
  
  return JSON.stringify({
    name: snapshot.name,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    components,
  }, null, 2);
};

/**
 * Convert token path to CSS variable name
 * e.g., "color.text.primary" -> "--color-text-primary"
 */
const tokenPathToCSSVar = (path: string): string => {
  return `--${path.replace(/\./g, "-")}`;
};

/**
 * Flatten nested object to dot notation paths
 */
const flattenObject = (obj: any, prefix: string = ""): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, path));
    } else {
      result[path] = value;
    }
  }
  
  return result;
};

/**
 * Export tokens.css as CSS custom properties
 */
export const exportTokensCss = (snapshot: DesignSystemSnapshot): string => {
  const lines: string[] = [];
  
  lines.push("/**");
  lines.push(` * ${snapshot.name}`);
  if (snapshot.description) {
    lines.push(` * ${snapshot.description}`);
  }
  lines.push(` * Version: ${snapshot.version}`);
  lines.push(` * Updated: ${new Date(snapshot.updatedAt).toLocaleString()}`);
  lines.push(" */");
  lines.push("");
  
  // Default theme
  lines.push(":root {");
  
  // Flatten and export all global tokens
  const flattened = flattenObject(snapshot.globals);
  
  for (const [path, value] of Object.entries(flattened)) {
    const cssVar = tokenPathToCSSVar(path);
    lines.push(`  ${cssVar}: ${value};`);
  }
  
  lines.push("}");
  lines.push("");
  
  // Component-specific tokens
  for (const [id, spec] of Object.entries(snapshot.components)) {
    lines.push(`/* Component: ${spec.label} */`);
    lines.push(`.component-${id} {`);
    
    const componentFlattened = flattenObject(spec.baseTokens, `component.${id}`);
    for (const [path, value] of Object.entries(componentFlattened)) {
      const cssVar = tokenPathToCSSVar(path);
      // Resolve references or use as-is
      const resolvedValue = typeof value === "string" && value.includes(".")
        ? `var(${tokenPathToCSSVar(value)})`
        : value;
      lines.push(`  ${cssVar}: ${resolvedValue};`);
    }
    
    lines.push("}");
    lines.push("");
  }
  
  // Optional inverse theme (if you want to support dark mode via snapshots)
  lines.push("/* Inverse/Dark Theme Support */");
  lines.push("[data-theme=\"inverse\"] {");
  lines.push("  /* These would be overridden by loading an 'inverse' snapshot */");
  lines.push("  /* Example: --color-surface-base: #0f172a; */");
  lines.push("}");
  
  return lines.join("\n");
};

/**
 * Export components.css: token-bound, scoped component layer
 * Uses snapshot name to derive data-theme selector (kebab-case)
 */
export const exportComponentsCss = (snapshot: DesignSystemSnapshot): string => {
  const themeSlug = (snapshot.name || "design-system")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "design-system";
  const themeSel = `[data-theme="${themeSlug}"]`;

  return `/* ${snapshot.name || "Design System"} components (token-driven) */
${themeSel} {
  font-family: var(--font-family-sans);
  background-color: var(--color-surface-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

${themeSel} * {
  box-sizing: border-box;
}

/* Typography rhythm */
${themeSel} h1,
${themeSel} h2,
${themeSel} h3,
${themeSel} h4 {
  margin: 0 0 var(--rhythm-heading-gap) 0;
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

${themeSel} h1 { font-size: var(--textRole-display-size); line-height: var(--textRole-display-lineHeight); }
${themeSel} h2 { font-size: var(--textRole-heading-size); line-height: var(--textRole-heading-lineHeight); }
${themeSel} h3 { font-size: var(--textRole-title-size); line-height: var(--textRole-title-lineHeight); }
${themeSel} h4 { font-size: var(--textRole-body-size); line-height: var(--textRole-body-lineHeight); }

${themeSel} p {
  margin: 0 0 var(--rhythm-stack-sm) 0;
  font-size: var(--textRole-body-size);
  line-height: var(--textRole-body-lineHeight);
  color: var(--color-text-secondary);
}

/* Vertical rhythm helpers */
${themeSel} .ds-stack { display: flex; flex-direction: column; gap: var(--rhythm-stack-md); }
${themeSel} .ds-stack--dense { gap: var(--rhythm-stack-sm); }
${themeSel} .ds-stack--loose { gap: var(--rhythm-stack-lg); }

${themeSel} .ds-section { margin-top: var(--rhythm-section); margin-bottom: var(--rhythm-section); }
${themeSel} .ds-section--tight { margin-top: var(--rhythm-section); margin-bottom: var(--rhythm-section); }
${themeSel} .ds-section--relaxed { margin-top: var(--rhythm-section-lg); margin-bottom: var(--rhythm-section-lg); }
${themeSel} .ds-section > * + * { margin-top: var(--rhythm-stack-md); }

/* Icon sizing */
${themeSel} .ds-icon { width: var(--icon-size-md); height: var(--icon-size-md); stroke-width: var(--icon-stroke); flex-shrink: 0; }
${themeSel} .ds-icon--sm { width: var(--icon-size-sm); height: var(--icon-size-sm); }
${themeSel} .ds-icon--lg { width: var(--icon-size-lg); height: var(--icon-size-lg); }
${themeSel} .ds-icon--xl { width: var(--icon-size-xl); height: var(--icon-size-xl); }

/* Focus ring utility */
${themeSel} .ds-focusable:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-ring-offset) rgba(37, 99, 235, 0.15);
}

/* Buttons */
${themeSel} .ds-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--component-button-height);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: var(--border-width-1) solid transparent;
  font-size: var(--textRole-body-size);
  font-weight: var(--weight-semibold);
  line-height: var(--line-height-tight);
  background: var(--color-accent-primary-base);
  color: var(--color-accent-primary-contrast);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: background var(--motion-duration-normal) var(--motion-easing-standard),
              box-shadow var(--motion-duration-normal) var(--motion-easing-standard),
              transform var(--motion-duration-fast) var(--motion-easing-standard);
}
${themeSel} .ds-btn:hover:not(:disabled) { background: var(--color-accent-primary-hover); box-shadow: var(--shadow-md); }
${themeSel} .ds-btn:active:not(:disabled) { background: var(--color-accent-primary-active); box-shadow: var(--shadow-sm); transform: translateY(1px); }
${themeSel} .ds-btn:disabled { cursor: not-allowed; background: var(--color-border-subtle); color: var(--color-text-disabled); box-shadow: var(--shadow-none); }

${themeSel} .ds-btn--secondary { background: var(--color-surface-elevated); color: var(--color-text-primary); border-color: var(--color-border-default); box-shadow: var(--shadow-xs); }
${themeSel} .ds-btn--secondary:hover:not(:disabled) { background: var(--color-surface-subtle); }
${themeSel} .ds-btn--ghost { background: transparent; color: var(--color-text-primary); border-color: transparent; box-shadow: var(--shadow-none); }
${themeSel} .ds-btn--ghost:hover:not(:disabled) { background: rgba(12, 18, 32, 0.05); }
${themeSel} .ds-btn--danger { background: var(--color-border-danger); color: var(--color-text-inverse); border-color: var(--color-border-danger); }

${themeSel} .ds-btn--sm { min-height: 36px; padding: var(--space-1) var(--space-3); font-size: var(--font-size-2); }
${themeSel} .ds-btn--lg { min-height: 48px; padding: var(--space-3) var(--space-5); font-size: var(--font-size-4); }

${themeSel} .ds-btn .ds-icon:first-child { margin-right: var(--space-2); }
${themeSel} .ds-btn .ds-icon:last-child { margin-left: var(--space-2); }

/* Form layout */
${themeSel} .ds-form { display: flex; flex-direction: column; gap: var(--rhythm-form-field); }
${themeSel} .ds-form__group { display: flex; flex-direction: column; gap: var(--rhythm-form-group); }
${themeSel} .ds-field { display: flex; flex-direction: column; gap: var(--rhythm-form-field); }
${themeSel} .ds-field__label { font-size: var(--textRole-label-size); font-weight: var(--textRole-label-weight); color: var(--color-text-secondary); }
${themeSel} .ds-field__hint { font-size: var(--textRole-caption-size); color: var(--color-text-muted); }

/* Inputs, selects, textareas */
${themeSel} .ds-input,
${themeSel} .ds-select,
${themeSel} .ds-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  min-height: var(--component-control-height);
  border-radius: var(--radius-md);
  border: var(--border-width-1) solid var(--color-border-default);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-size: var(--textRole-body-size);
  line-height: var(--textRole-body-lineHeight);
  transition: border-color var(--motion-duration-normal) var(--motion-easing-standard), box-shadow var(--motion-duration-normal) var(--motion-easing-standard);
}
${themeSel} .ds-input::placeholder,
${themeSel} .ds-select::placeholder,
${themeSel} .ds-textarea::placeholder { color: var(--color-text-muted); }
${themeSel} .ds-input:hover,
${themeSel} .ds-select:hover,
${themeSel} .ds-textarea:hover { border-color: var(--color-border-focus); }
${themeSel} .ds-input:focus-visible,
${themeSel} .ds-select:focus-visible,
${themeSel} .ds-textarea:focus-visible {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 calc(var(--focus-ring-width)) rgba(37, 99, 235, 0.35);
}
${themeSel} .ds-input:disabled,
${themeSel} .ds-select:disabled,
${themeSel} .ds-textarea:disabled { background: var(--color-surface-subtle); color: var(--color-text-disabled); border-color: var(--color-border-subtle); cursor: not-allowed; }
${themeSel} .ds-input.is-error,
${themeSel} .ds-select.is-error,
${themeSel} .ds-textarea.is-error { border-color: var(--color-border-danger); }
${themeSel} .ds-textarea { min-height: 120px; line-height: var(--line-height-relaxed); padding: var(--space-3); resize: vertical; }

/* Card / panel */
${themeSel} .ds-card {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: var(--border-width-1) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--component-card-padding);
  box-shadow: var(--shadow-md);
}
${themeSel} .ds-card__header { margin-bottom: var(--rhythm-stack-sm); display: flex; align-items: center; gap: var(--space-3); }
${themeSel} .ds-card__body > * + * { margin-top: var(--rhythm-stack-sm); }

/* Table */
${themeSel} .ds-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--color-surface-elevated);
  border: var(--border-width-1) solid var(--color-border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}
${themeSel} .ds-table th,
${themeSel} .ds-table td {
  padding: var(--component-table-cell-padding-y) var(--component-table-cell-padding-x);
  text-align: left;
  border-bottom: var(--border-width-1) solid var(--color-border-subtle);
  color: var(--color-text-primary);
}
${themeSel} .ds-table th { background: var(--color-surface-subtle); font-weight: var(--weight-semibold); }
${themeSel} .ds-table tbody tr:hover { background: rgba(12, 18, 32, 0.03); }

/* Modal / dialog */
${themeSel} .ds-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 32, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  z-index: 999;
}
${themeSel} .ds-modal {
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xl);
  padding: var(--component-modal-padding);
  box-shadow: var(--shadow-overlay);
  max-width: 720px;
  width: min(720px, 100%);
  display: flex;
  flex-direction: column;
  gap: var(--rhythm-stack-md);
  border: var(--border-width-1) solid var(--color-border-default);
}
${themeSel} .ds-modal__header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
${themeSel} .ds-modal__footer { display: flex; justify-content: flex-end; gap: var(--space-3); }

/* Alerts */
${themeSel} .ds-alert {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  color: var(--color-text-primary);
  background: var(--color-surface-subtle);
  border: var(--border-width-1) solid var(--color-border-default);
}
${themeSel} .ds-alert__title { font-weight: var(--weight-semibold); margin-bottom: var(--space-1); }
${themeSel} .ds-alert__body { margin: 0; color: var(--color-text-secondary); }
${themeSel} .ds-alert--info { background: var(--color-info-base); color: var(--color-info-contrast); border-color: transparent; }
${themeSel} .ds-alert--success { background: var(--color-success-base); color: var(--color-success-contrast); border-color: transparent; }
${themeSel} .ds-alert--warning { background: var(--color-warning-base); color: var(--color-warning-contrast); border-color: transparent; }
${themeSel} .ds-alert--danger { background: var(--color-border-danger); color: #ffffff; border-color: transparent; }

/* Badges */
${themeSel} .ds-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--component-badge-padding-y) var(--component-badge-padding-x);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-2);
  font-weight: var(--weight-medium);
  line-height: var(--line-height-tight);
  background: var(--color-info-base);
  color: var(--color-info-contrast);
}
${themeSel} .ds-badge--neutral { background: var(--color-surface-subtle); color: var(--color-text-primary); }
${themeSel} .ds-badge--success { background: var(--color-success-base); color: var(--color-success-contrast); }
${themeSel} .ds-badge--warning { background: var(--color-warning-base); color: var(--color-warning-contrast); }
${themeSel} .ds-badge--danger { background: var(--color-border-danger); color: #ffffff; }

/* Tabs / navigation */
${themeSel} .ds-tabs { display: flex; gap: var(--space-4); border-bottom: var(--border-width-1) solid var(--color-border-subtle); }
${themeSel} .ds-tab {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: var(--weight-medium);
  cursor: pointer;
  border: var(--border-width-1) solid transparent;
  border-bottom: none;
}
${themeSel} .ds-tab:hover { color: var(--color-text-primary); background: rgba(12, 18, 32, 0.04); }
${themeSel} .ds-tab.is-active {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  border-color: var(--color-border-subtle);
  border-bottom: var(--border-width-1) solid var(--color-surface-elevated);
}

/* Lists */
${themeSel} .ds-list { display: flex; flex-direction: column; gap: var(--rhythm-stack-sm); padding-left: var(--space-4); margin: 0; }
${themeSel} .ds-list__item { display: flex; align-items: flex-start; gap: var(--space-3); color: var(--color-text-secondary); }

/* Page framing */
${themeSel} .ds-page { display: flex; flex-direction: column; gap: var(--rhythm-section); }
${themeSel} .ds-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-6); background: var(--color-surface-elevated); border-bottom: var(--border-width-1) solid var(--color-border-default); box-shadow: var(--shadow-sm); }
${themeSel} .ds-footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-6); background: var(--color-surface-subtle); border-top: var(--border-width-1) solid var(--color-border-default); }

/* Navigation list */
${themeSel} .ds-nav { display: flex; gap: var(--space-4); align-items: center; }
${themeSel} .ds-nav__item { padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); color: var(--color-text-secondary); }
${themeSel} .ds-nav__item:hover { background: rgba(12, 18, 32, 0.05); color: var(--color-text-primary); }
${themeSel} .ds-nav__item.is-active { color: var(--color-text-primary); background: rgba(37, 99, 235, 0.10); }

/* Utility spacing between stacked components */
${themeSel} .ds-block + .ds-block { margin-top: var(--rhythm-stack-lg); }
`;
};

/**
 * Export Figma Variables mapping
 */
export const exportFigmaVariablesJson = (snapshot: DesignSystemSnapshot): string => {
  const collections: any[] = [];
  
  // Global collection
  const globalCollection = {
    id: "global",
    name: "Global Tokens",
    modes: [
      {
        modeId: "default",
        name: "Default"
      }
    ],
    variables: [] as any[]
  };
  
  const flattened = flattenObject(snapshot.globals);
  
  for (const [path, value] of Object.entries(flattened)) {
    // Determine variable type based on path
    let variableType = "STRING";
    let resolvedValue: any = value;
    
    if (path.startsWith("color.")) {
      variableType = "COLOR";
      // Convert hex to Figma color format if needed
      if (typeof value === "string" && value.startsWith("#")) {
        // Figma uses RGBA format with values 0-1
        const hex = value.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
        resolvedValue = { r, g, b, a };
      }
    } else if (path.startsWith("space.") || path.startsWith("radius.") || path.includes("size")) {
      variableType = "FLOAT";
      // Extract numeric value
      if (typeof value === "string") {
        const match = value.match(/^([\d.]+)/);
        if (match) {
          resolvedValue = parseFloat(match[1]);
        }
      }
    } else if (path.startsWith("weight.")) {
      variableType = "FLOAT";
      resolvedValue = typeof value === "number" ? value : parseFloat(String(value));
    }
    
    globalCollection.variables.push({
      id: `var-${path.replace(/\./g, "-")}`,
      name: path,
      type: variableType,
      valuesByMode: {
        default: resolvedValue
      },
      scopes: getVariableScopes(path),
      codeSyntax: {
        WEB: tokenPathToCSSVar(path)
      }
    });
  }
  
  collections.push(globalCollection);
  
  // Component collections (optional, can group by component)
  const componentCollection = {
    id: "components",
    name: "Component Tokens",
    modes: [
      {
        modeId: "default",
        name: "Default"
      }
    ],
    variables: [] as any[]
  };
  
  for (const [id, spec] of Object.entries(snapshot.components)) {
    const componentFlattened = flattenObject(spec.baseTokens, `component.${id}`);
    
    for (const [path, value] of Object.entries(componentFlattened)) {
      let variableType = "STRING";
      let resolvedValue: any = value;
      
      // Try to resolve references
      if (typeof value === "string" && value.includes(".")) {
        // This is a reference to a global token
        const refVarId = `var-${value.replace(/\./g, "-")}`;
        resolvedValue = { type: "VARIABLE_ALIAS", id: refVarId };
      }
      
      componentCollection.variables.push({
        id: `var-${path.replace(/\./g, "-")}`,
        name: path,
        type: variableType,
        valuesByMode: {
          default: resolvedValue
        },
        scopes: ["ALL_SCOPES"],
        codeSyntax: {
          WEB: tokenPathToCSSVar(path)
        }
      });
    }
  }
  
  if (componentCollection.variables.length > 0) {
    collections.push(componentCollection);
  }
  
  return JSON.stringify({
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    sourceSystem: snapshot.name,
    sourceVersion: snapshot.version,
    collections
  }, null, 2);
};

/**
 * Determine Figma variable scopes based on token path
 */
const getVariableScopes = (path: string): string[] => {
  if (path.startsWith("color.")) {
    return ["ALL_FILLS", "ALL_STROKES", "FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"];
  }
  if (path.startsWith("space.") || path.startsWith("radius.")) {
    return ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"];
  }
  if (path.includes("size")) {
    return ["FONT_SIZE", "WIDTH_HEIGHT"];
  }
  if (path.startsWith("weight.")) {
    return ["FONT_WEIGHT"];
  }
  if (path.startsWith("lineHeight.")) {
    return ["LINE_HEIGHT"];
  }
  if (path.startsWith("shadow.")) {
    return ["EFFECT_COLOR"];
  }
  return ["ALL_SCOPES"];
};

/**
 * Export README with usage instructions
 */
export const exportReadme = (snapshot: DesignSystemSnapshot): string => {
  const lines: string[] = [];
  
  lines.push(`# ${snapshot.name}`);
  lines.push("");
  if (snapshot.description) {
    lines.push(snapshot.description);
    lines.push("");
  }
  lines.push(`**Version:** ${snapshot.version}  `);
  lines.push(`**Last Updated:** ${new Date(snapshot.updatedAt).toLocaleString()}  `);
  lines.push("");
  
  lines.push("## Exported Files");
  lines.push("");
  lines.push("This design system export includes the following files:");
  lines.push("");
  lines.push("- **tokens.json** - Complete token definitions with resolved values");
  lines.push("- **components.json** - Component contracts, anatomy, and token overrides");
  lines.push("- **tokens.css** - CSS custom properties for direct browser use");
  lines.push("- **components.css** - Token-bound component styles for runtime");
  lines.push("- **figma-variables.json** - Figma Variables import mapping");
  lines.push("- **README.md** - This file");
  lines.push("");
  
  lines.push("## Usage Guide");
  lines.push("");
  
  lines.push("### For Developers");
  lines.push("");
  lines.push("#### Using CSS Variables");
  lines.push("```html");
  lines.push('<link rel="stylesheet" href="tokens.css">');
  lines.push("```");
  lines.push("");
  lines.push("```css");
  lines.push("/* Use tokens in your CSS */");
  lines.push(".my-button {");
  lines.push("  background-color: var(--color-accent-primary-base);");
  lines.push("  color: var(--color-accent-primary-contrast);");
  lines.push("  padding: var(--space-2) var(--space-4);");
  lines.push("  border-radius: var(--radius-md);");
  lines.push("}");
  lines.push("```");
  lines.push("");
  
  lines.push("#### Using JSON Tokens");
  lines.push("```typescript");
  lines.push("import tokens from './tokens.json';");
  lines.push("import components from './components.json';");
  lines.push("");
  lines.push("// Access resolved global tokens");
  lines.push("const primaryColor = tokens.computed.color.accent.primary.base;");
  lines.push("");
  lines.push("// Access component tokens");
  lines.push("const buttonTokens = components.components.button.baseResolved;");
  lines.push("```");
  lines.push("");
  
  lines.push("### For AI Agents & Code Generation");
  lines.push("");
  lines.push("When generating components, follow these rules:");
  lines.push("");
  lines.push("1. **Always use token references** from tokens.json, never hardcode values");
  lines.push("2. **Respect component contracts** defined in components.json");
  lines.push("3. **Implement all required states** listed in contract.requiredStates");
  lines.push("4. **Never override forbidden properties** listed in contract.forbiddenOverrides");
  lines.push("5. **Use semantic token names** (e.g., `color.text.primary` not `#000000`)");
  lines.push("");
  
  lines.push("#### Component Contract Example");
  lines.push("```typescript");
  lines.push("// Button contract from components.json");
  lines.push("const contract = components.components.button.contract;");
  lines.push("");
  lines.push("// Required states to implement:");
  lines.push("// " + (snapshot.components.button?.contract.requiredStates || []).join(", "));
  lines.push("");
  lines.push("// Forbidden overrides (do not customize these):");
  lines.push("// " + (snapshot.components.button?.contract.forbiddenOverrides || []).join(", "));
  lines.push("```");
  lines.push("");
  
  lines.push("### For Designers");
  lines.push("");
  lines.push("#### Importing to Figma");
  lines.push("");
  lines.push("1. Use a Figma plugin that supports variable import (e.g., 'Variables Import')");
  lines.push("2. Load `figma-variables.json`");
  lines.push("3. Map collections to your Figma file");
  lines.push("4. Variables will be created with proper scopes and types");
  lines.push("");
  lines.push("The mapping includes:");
  lines.push("- Color tokens → Color variables");
  lines.push("- Spacing tokens → Number variables");
  lines.push("- Typography tokens → Number/String variables");
  lines.push("- Component tokens → Aliased variables (referencing global tokens)");
  lines.push("");
  
  lines.push("## Token Structure");
  lines.push("");
  lines.push("### Global Tokens");
  lines.push("");
  lines.push("Global tokens are organized into categories:");
  lines.push("");
  lines.push("- `color.*` - Color palette (surface, text, border, accent, danger)");
  lines.push("- `font.*` - Font families and sizes");
  lines.push("- `textRole.*` - Semantic text styles (display, heading, body, etc.)");
  lines.push("- `space.*` - Spacing scale (0-8)");
  lines.push("- `radius.*` - Border radius values");
  lines.push("- `shadow.*` - Box shadow definitions");
  lines.push("- `motion.*` - Animation duration and easing");
  lines.push("- `weight.*` - Font weights");
  lines.push("- `lineHeight.*` - Line height values");
  lines.push("");
  
  lines.push("### Component Tokens");
  lines.push("");
  lines.push("Each component has:");
  lines.push("");
  lines.push("- **baseTokens** - Default appearance tokens");
  lines.push("- **states** - State-specific overrides (hover, focus, disabled, etc.)");
  lines.push("- **variants** - Named variations (size, intent, style)");
  lines.push("- **contract** - Anatomical structure and semantic meaning");
  lines.push("");
  
  lines.push("## Available Components");
  lines.push("");
  const componentList = Object.values(snapshot.components).map(c => `- **${c.label}** (${c.id})`);
  lines.push(...componentList);
  lines.push("");
  
  lines.push("## Forbidden Overrides");
  lines.push("");
  lines.push("These properties must NOT be customized per component contract:");
  lines.push("");
  for (const [id, spec] of Object.entries(snapshot.components)) {
    if (spec.contract.forbiddenOverrides.length > 0) {
      lines.push(`- **${spec.label}**: ${spec.contract.forbiddenOverrides.join(", ")}`);
    }
  }
  lines.push("");
  
  lines.push("## System Philosophy");
  lines.push("");
  lines.push("This is a **code-first** design system:");
  lines.push("");
  lines.push("- Tokens + component contracts are the source of truth");
  lines.push("- CSS is derived from tokens, not the other way around");
  lines.push("- All styles must be token-driven (no magic numbers)");
  lines.push("- Components must respect their contracts");
  lines.push("- AI/agents should consume tokens + contracts to generate UI");
  lines.push("");
  
  lines.push("## Support & Questions");
  lines.push("");
  lines.push("For questions about this design system export:");
  lines.push("");
  lines.push("1. Check the component contract in `components.json`");
  lines.push("2. Verify token references in `tokens.json`");
  lines.push("3. Review computed values for resolved token values");
  lines.push("4. Ensure you're using semantic token names, not hardcoded values");
  lines.push("");
  
  return lines.join("\n");
};

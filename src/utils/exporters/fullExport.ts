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

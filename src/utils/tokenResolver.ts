import { Globals, ComponentTokens } from "@models/designSystem";

/**
 * Resolves token references like "color.text.primary" to actual values
 */
export const resolveToken = (tokenPath: string, globals: Globals): string => {
  if (!tokenPath || typeof tokenPath !== "string") return tokenPath;
  
  // If it doesn't look like a reference, return as-is
  if (!tokenPath.includes(".")) return tokenPath;
  
  const parts = tokenPath.split(".");
  let current: any = globals;
  
  for (const part of parts) {
    if (current == null) return tokenPath;
    current = current[part];
  }
  
  return current != null ? String(current) : tokenPath;
};

/**
 * Resolves all token references in a ComponentTokens object
 */
export const resolveComponentTokens = (tokens: ComponentTokens, globals: Globals): Record<string, any> => {
  const resolved: Record<string, any> = {};
  
  if (tokens.color) {
    resolved.color = {
      fg: tokens.color.fg ? resolveToken(tokens.color.fg, globals) : undefined,
      bg: tokens.color.bg ? resolveToken(tokens.color.bg, globals) : undefined,
      border: tokens.color.border ? resolveToken(tokens.color.border, globals) : undefined,
    };
  }
  
  if (tokens.typography) {
    resolved.typography = {
      fontFamily: tokens.typography.fontFamily ? resolveToken(tokens.typography.fontFamily, globals) : undefined,
      size: tokens.typography.size ? resolveToken(tokens.typography.size, globals) : undefined,
      weight: tokens.typography.weight ? resolveToken(tokens.typography.weight, globals) : undefined,
      letterSpacing: tokens.typography.letterSpacing,
      lineHeight: tokens.typography.lineHeight ? resolveToken(tokens.typography.lineHeight, globals) : undefined,
    };
  }
  
  if (tokens.spacing) {
    resolved.spacing = {
      paddingX: tokens.spacing.paddingX ? resolveToken(tokens.spacing.paddingX, globals) : undefined,
      paddingY: tokens.spacing.paddingY ? resolveToken(tokens.spacing.paddingY, globals) : undefined,
      gap: tokens.spacing.gap ? resolveToken(tokens.spacing.gap, globals) : undefined,
    };
  }
  
  if (tokens.radius) {
    resolved.radius = resolveToken(tokens.radius, globals);
  }
  
  if (tokens.shadow) {
    resolved.shadow = resolveToken(tokens.shadow, globals);
  }
  
  if (tokens.border) {
    resolved.border = {
      width: tokens.border.width,
      style: tokens.border.style,
      color: tokens.border.color ? resolveToken(tokens.border.color, globals) : undefined,
    };
  }
  
  if (tokens.motion) {
    resolved.motion = {
      transition: tokens.motion.transition,
      duration: tokens.motion.duration ? resolveToken(tokens.motion.duration, globals) : undefined,
      easing: tokens.motion.easing ? resolveToken(tokens.motion.easing, globals) : undefined,
    };
  }
  
  if (tokens.layout) {
    resolved.layout = {
      minWidth: tokens.layout.minWidth,
      maxWidth: tokens.layout.maxWidth,
    };
  }
  
  return resolved;
};

/**
 * Convert resolved tokens to CSS custom properties
 */
export const tokensToCSSVars = (prefix: string, tokens: Record<string, any>): Record<string, string> => {
  const cssVars: Record<string, string> = {};
  
  const flatten = (obj: any, path: string[] = []) => {
    if (obj == null || typeof obj !== "object") {
      const key = `--${prefix}-${path.join("-")}`;
      cssVars[key] = String(obj);
      return;
    }
    
    for (const [k, v] of Object.entries(obj)) {
      if (v != null) {
        flatten(v, [...path, k]);
      }
    }
  };
  
  flatten(tokens);
  return cssVars;
};

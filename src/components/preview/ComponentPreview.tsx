import React from "react";
import { resolveToken } from "@utils/tokenResolver";
import { Globals, ComponentTokens } from "@models/designSystem";
import "@styles/globals.css";

interface PreviewProps {
  componentId: string;
  baseTokens: ComponentTokens;
  stateTokens: Record<string, ComponentTokens>;
  globals: Globals;
}

export const ComponentPreview: React.FC<PreviewProps> = ({ componentId, baseTokens, stateTokens, globals }) => {
  // Merge base tokens with state tokens for each state
  const getResolvedTokens = (state: string) => {
    const merged = {
      ...baseTokens,
      color: { ...baseTokens.color, ...(stateTokens[state]?.color || {}) },
      typography: { ...baseTokens.typography, ...(stateTokens[state]?.typography || {}) },
      spacing: { ...baseTokens.spacing, ...(stateTokens[state]?.spacing || {}) },
      border: { ...baseTokens.border, ...(stateTokens[state]?.border || {}) },
      radius: stateTokens[state]?.radius || baseTokens.radius,
      shadow: stateTokens[state]?.shadow || baseTokens.shadow,
      motion: { ...baseTokens.motion, ...(stateTokens[state]?.motion || {}) },
    };
    
    return {
      color: {
        fg: resolveToken(merged.color?.fg || "", globals),
        bg: resolveToken(merged.color?.bg || "", globals),
        border: resolveToken(merged.color?.border || "", globals),
      },
      typography: {
        fontFamily: resolveToken(merged.typography?.fontFamily || "globals.font.family.sans", globals),
        size: resolveToken(merged.typography?.size || "font.size.2", globals),
        weight: resolveToken(merged.typography?.weight || "weight.regular", globals),
        lineHeight: resolveToken(merged.typography?.lineHeight || "lineHeight.normal", globals),
      },
      spacing: {
        paddingX: resolveToken(merged.spacing?.paddingX || "space.3", globals),
        paddingY: resolveToken(merged.spacing?.paddingY || "space.2", globals),
        gap: resolveToken(merged.spacing?.gap || "space.2", globals),
      },
      radius: resolveToken(merged.radius || "radius.md", globals),
      shadow: resolveToken(merged.shadow || "shadow.none", globals),
      border: {
        width: merged.border?.width || "1px",
        style: merged.border?.style || "solid",
        color: resolveToken(merged.border?.color || "", globals),
      },
    };
  };

  const renderButton = (state: string) => {
    const tokens = getResolvedTokens(state);
    const style: React.CSSProperties = {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.size,
      fontWeight: tokens.typography.weight,
      lineHeight: tokens.typography.lineHeight,
      color: tokens.color.fg,
      backgroundColor: tokens.color.bg,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      border: `${tokens.border.width} ${tokens.border.style} ${tokens.border.color || tokens.color.border}`,
      paddingLeft: tokens.spacing.paddingX,
      paddingRight: tokens.spacing.paddingX,
      paddingTop: tokens.spacing.paddingY,
      paddingBottom: tokens.spacing.paddingY,
      cursor: state === "disabled" ? "not-allowed" : "pointer",
      opacity: state === "disabled" ? 0.6 : 1,
      display: "inline-flex",
      alignItems: "center",
      gap: tokens.spacing.gap,
      transition: "all 200ms ease",
    };

    return (
      <button style={style} disabled={state === "disabled"}>
        {state === "loading" ? "Loading..." : "Button"}
      </button>
    );
  };

  const renderInput = (state: string) => {
    const tokens = getResolvedTokens(state);
    const style: React.CSSProperties = {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.size,
      fontWeight: tokens.typography.weight,
      lineHeight: tokens.typography.lineHeight,
      color: tokens.color.fg,
      backgroundColor: tokens.color.bg,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      border: `${tokens.border.width} ${tokens.border.style} ${tokens.border.color || tokens.color.border}`,
      paddingLeft: tokens.spacing.paddingX,
      paddingRight: tokens.spacing.paddingX,
      paddingTop: tokens.spacing.paddingY,
      paddingBottom: tokens.spacing.paddingY,
      outline: "none",
      transition: "all 200ms ease",
      width: "200px",
    };

    return (
      <input
        type="text"
        style={style}
        placeholder={state === "error" ? "Error state" : "Placeholder"}
        disabled={state === "disabled"}
        readOnly={state === "loading"}
      />
    );
  };

  const renderCard = (state: string) => {
    const tokens = getResolvedTokens(state);
    const style: React.CSSProperties = {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.size,
      color: tokens.color.fg,
      backgroundColor: tokens.color.bg,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      border: `${tokens.border.width} ${tokens.border.style} ${tokens.border.color || tokens.color.border}`,
      paddingLeft: tokens.spacing.paddingX,
      paddingRight: tokens.spacing.paddingX,
      paddingTop: tokens.spacing.paddingY,
      paddingBottom: tokens.spacing.paddingY,
      transition: "all 200ms ease",
      minWidth: "200px",
    };

    return (
      <div style={style}>
        <div style={{ fontWeight: "600", marginBottom: "8px" }}>Card Title</div>
        <div style={{ opacity: 0.8 }}>Card content goes here</div>
      </div>
    );
  };

  const renderGeneric = (state: string) => {
    const tokens = getResolvedTokens(state);
    const style: React.CSSProperties = {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.size,
      fontWeight: tokens.typography.weight,
      color: tokens.color.fg,
      backgroundColor: tokens.color.bg,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      border: `${tokens.border.width} ${tokens.border.style} ${tokens.border.color || tokens.color.border}`,
      paddingLeft: tokens.spacing.paddingX,
      paddingRight: tokens.spacing.paddingX,
      paddingTop: tokens.spacing.paddingY,
      paddingBottom: tokens.spacing.paddingY,
      transition: "all 200ms ease",
      display: "inline-block",
    };

    return <div style={style}>{componentId}</div>;
  };

  const renderComponent = (state: string) => {
    switch (componentId) {
      case "button":
        return renderButton(state);
      case "input":
        return renderInput(state);
      case "card":
        return renderCard(state);
      default:
        return renderGeneric(state);
    }
  };

  const states = Object.keys(stateTokens).length > 0 
    ? Object.keys(stateTokens)
    : ["default", "hover", "active", "focus", "disabled"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", padding: "24px 0" }}>
      {states.map((state) => (
        <div key={state} style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <div style={{ fontSize: "13px", color: "#475569", fontWeight: "500", textTransform: "capitalize" }}>
            {state}
          </div>
          <div>{renderComponent(state)}</div>
        </div>
      ))}
    </div>
  );
};

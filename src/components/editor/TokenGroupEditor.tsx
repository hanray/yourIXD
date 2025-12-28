import React, { useState } from "react";
import { ComponentTokens } from "@models/designSystem";

interface TokenEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  useGlobal: boolean;
  onToggleGlobal: () => void;
}

const TokenInput: React.FC<TokenEditorProps> = ({ label, value, onChange, useGlobal, onToggleGlobal }) => {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
      <label style={{ flex: "0 0 140px", fontSize: "13px", color: "#475569" }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={useGlobal}
        style={{
          flex: 1,
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          fontSize: "13px",
          backgroundColor: useGlobal ? "#f8f9fb" : "#ffffff",
        }}
      />
      <button
        onClick={onToggleGlobal}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
          backgroundColor: useGlobal ? "#0f62fe" : "#ffffff",
          color: useGlobal ? "#ffffff" : "#0f172a",
          cursor: "pointer",
        }}
      >
        {useGlobal ? "Override" : "Use Global"}
      </button>
    </div>
  );
};

interface TokenGroupEditorProps {
  title: string;
  tokens: ComponentTokens;
  overrides: Partial<ComponentTokens>;
  onChange: (path: string, value: string | undefined) => void;
}

export const TokenGroupEditor: React.FC<TokenGroupEditorProps> = ({ title, tokens, overrides, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const isOverridden = (path: string) => {
    const parts = path.split(".");
    let current: any = overrides;
    for (const part of parts) {
      if (current == null) return false;
      current = current[part];
    }
    return current !== undefined;
  };

  const getValue = (path: string) => {
    const parts = path.split(".");
    let current: any = overrides;
    for (const part of parts) {
      if (current == null) break;
      current = current[part];
    }
    if (current !== undefined) return current;

    // Fallback to base tokens
    current = tokens;
    for (const part of parts) {
      if (current == null) return "";
      current = current[part];
    }
    return current || "";
  };

  const handleToggle = (path: string) => {
    if (isOverridden(path)) {
      onChange(path, undefined);
    } else {
      onChange(path, getValue(path));
    }
  };

  const renderColorTokens = () => {
    if (!tokens.color) return null;
    return (
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#0f172a" }}>Colors</div>
        {tokens.color.fg && (
          <TokenInput
            label="Foreground"
            value={getValue("color.fg")}
            onChange={(v) => onChange("color.fg", v)}
            useGlobal={!isOverridden("color.fg")}
            onToggleGlobal={() => handleToggle("color.fg")}
          />
        )}
        {tokens.color.bg && (
          <TokenInput
            label="Background"
            value={getValue("color.bg")}
            onChange={(v) => onChange("color.bg", v)}
            useGlobal={!isOverridden("color.bg")}
            onToggleGlobal={() => handleToggle("color.bg")}
          />
        )}
        {tokens.color.border && (
          <TokenInput
            label="Border Color"
            value={getValue("color.border")}
            onChange={(v) => onChange("color.border", v)}
            useGlobal={!isOverridden("color.border")}
            onToggleGlobal={() => handleToggle("color.border")}
          />
        )}
      </div>
    );
  };

  const renderTypographyTokens = () => {
    if (!tokens.typography) return null;
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#0f172a" }}>Typography</div>
        {tokens.typography.size && (
          <TokenInput
            label="Font Size"
            value={getValue("typography.size")}
            onChange={(v) => onChange("typography.size", v)}
            useGlobal={!isOverridden("typography.size")}
            onToggleGlobal={() => handleToggle("typography.size")}
          />
        )}
        {tokens.typography.weight && (
          <TokenInput
            label="Font Weight"
            value={getValue("typography.weight")}
            onChange={(v) => onChange("typography.weight", v)}
            useGlobal={!isOverridden("typography.weight")}
            onToggleGlobal={() => handleToggle("typography.weight")}
          />
        )}
        {tokens.typography.lineHeight && (
          <TokenInput
            label="Line Height"
            value={getValue("typography.lineHeight")}
            onChange={(v) => onChange("typography.lineHeight", v)}
            useGlobal={!isOverridden("typography.lineHeight")}
            onToggleGlobal={() => handleToggle("typography.lineHeight")}
          />
        )}
      </div>
    );
  };

  const renderSpacingTokens = () => {
    if (!tokens.spacing) return null;
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#0f172a" }}>Spacing</div>
        {tokens.spacing.paddingX && (
          <TokenInput
            label="Padding X"
            value={getValue("spacing.paddingX")}
            onChange={(v) => onChange("spacing.paddingX", v)}
            useGlobal={!isOverridden("spacing.paddingX")}
            onToggleGlobal={() => handleToggle("spacing.paddingX")}
          />
        )}
        {tokens.spacing.paddingY && (
          <TokenInput
            label="Padding Y"
            value={getValue("spacing.paddingY")}
            onChange={(v) => onChange("spacing.paddingY", v)}
            useGlobal={!isOverridden("spacing.paddingY")}
            onToggleGlobal={() => handleToggle("spacing.paddingY")}
          />
        )}
        {tokens.spacing.gap && (
          <TokenInput
            label="Gap"
            value={getValue("spacing.gap")}
            onChange={(v) => onChange("spacing.gap", v)}
            useGlobal={!isOverridden("spacing.gap")}
            onToggleGlobal={() => handleToggle("spacing.gap")}
          />
        )}
      </div>
    );
  };

  const renderOtherTokens = () => {
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#0f172a" }}>Other</div>
        {tokens.radius && (
          <TokenInput
            label="Border Radius"
            value={getValue("radius")}
            onChange={(v) => onChange("radius", v)}
            useGlobal={!isOverridden("radius")}
            onToggleGlobal={() => handleToggle("radius")}
          />
        )}
        {tokens.shadow && (
          <TokenInput
            label="Shadow"
            value={getValue("shadow")}
            onChange={(v) => onChange("shadow", v)}
            useGlobal={!isOverridden("shadow")}
            onToggleGlobal={() => handleToggle("shadow")}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          padding: "12px",
          backgroundColor: "#f8f9fb",
          borderRadius: "8px",
          marginBottom: expanded ? "16px" : "0",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{title}</span>
        <span style={{ marginLeft: "auto", transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 200ms" }}>
          ▶
        </span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: "12px" }}>
          {renderColorTokens()}
          {renderTypographyTokens()}
          {renderSpacingTokens()}
          {renderOtherTokens()}
        </div>
      )}
    </div>
  );
};

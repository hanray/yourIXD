import { useMemo, useState, type CSSProperties } from "react";
import { ComponentTokens, DesignSystemSnapshot } from "@models/designSystem";
import { useDesignSystem } from "@state/store";
import { Surface } from "@components/common/Surface";

const resolvePath = (snapshot: DesignSystemSnapshot, ref?: string) => {
  if (!ref) return undefined;
  if (!ref.includes(".")) return ref;
  const parts = ref.split(".");
  let node: any = snapshot.globals as any;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = node[part];
    } else {
      return ref;
    }
  }
  return typeof node === "string" || typeof node === "number" ? String(node) : ref;
};

const tokensToStyle = (snapshot: DesignSystemSnapshot, tokens: ComponentTokens) => {
  const fg = resolvePath(snapshot, tokens.color?.fg);
  const bg = resolvePath(snapshot, tokens.color?.bg);
  const borderColor = resolvePath(snapshot, tokens.color?.border);
  const paddingX = resolvePath(snapshot, tokens.spacing?.paddingX);
  const paddingY = resolvePath(snapshot, tokens.spacing?.paddingY);
  const radius = resolvePath(snapshot, tokens.radius);
  const shadow = resolvePath(snapshot, tokens.shadow);
  const borderWidth = resolvePath(snapshot, tokens.border?.width) ?? tokens.border?.width;
  const borderStyle = tokens.border?.style ?? (borderColor ? "solid" : undefined);
  const typography = tokens.typography ?? {};

  const style: CSSProperties = {
    color: fg,
    backgroundColor: bg,
    boxShadow: shadow,
    borderRadius: radius,
    padding: paddingX && paddingY ? `${paddingY} ${paddingX}` : undefined,
    borderColor: borderColor,
    borderWidth: borderColor ? borderWidth ?? "1px" : undefined,
    borderStyle: borderColor ? borderStyle ?? "solid" : undefined,
    fontSize: resolvePath(snapshot, typography.size),
    fontWeight: typography.weight ? Number(resolvePath(snapshot, typography.weight)) || typography.weight : undefined,
    letterSpacing: resolvePath(snapshot, typography.letterSpacing),
    lineHeight: resolvePath(snapshot, typography.lineHeight),
    fontFamily: typography.fontFamily ?? snapshot.globals.font.family.sans,
    transition: tokens.motion?.transition,
    minWidth: tokens.layout?.minWidth,
    maxWidth: tokens.layout?.maxWidth
  };

  return style;
};

const mergeTokens = (...tokens: Array<ComponentTokens | undefined>) => {
  const result: ComponentTokens = {};
  tokens.forEach((t) => {
    if (!t) return;
    result.color = { ...result.color, ...t.color };
    result.typography = { ...result.typography, ...t.typography };
    result.spacing = { ...result.spacing, ...t.spacing };
    result.border = { ...result.border, ...t.border };
    if (t.radius) result.radius = t.radius;
    if (t.shadow) result.shadow = t.shadow;
    if (t.motion) result.motion = { ...result.motion, ...t.motion };
    if (t.layout) result.layout = { ...result.layout, ...t.layout };
  });
  return result;
};

type Props = { componentId?: string };

export const LivePreview = ({ componentId }: Props) => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const spec = componentId ? snapshot.components[componentId] : undefined;
  const [stateKey, setStateKey] = useState<string>("default");
  const [variantKey, setVariantKey] = useState<string>("default");
  const [polarity, setPolarity] = useState<"default" | "inverse">("default");

  const tokens = useMemo(() => {
    if (!spec) return undefined;
    const base = spec.baseTokens;
    const stateTokens = stateKey !== "default" ? spec.states?.[stateKey] : undefined;
    const variantTokens = variantKey !== "default" ? spec.variants?.[variantKey] : undefined;
    return mergeTokens(base, stateTokens, variantTokens);
  }, [spec, stateKey, variantKey]);

  const style = tokens ? tokensToStyle(snapshot, tokens) : undefined;

  return (
    <div
      style={{
        borderLeft: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
        overflow: "auto"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Live Preview</div>
        {spec && (
          <div style={{ display: "flex", gap: 8 }}>
            <select style={pillInput} value={stateKey} onChange={(e) => setStateKey(e.target.value)}>
              <option value="default">State: default</option>
              {Object.keys(spec.states ?? {}).map((s) => (
                <option key={s} value={s}>
                  State: {s}
                </option>
              ))}
            </select>
            <select style={pillInput} value={variantKey} onChange={(e) => setVariantKey(e.target.value)}>
              <option value="default">Variant: default</option>
              {Object.keys(spec.variants ?? {}).map((v) => (
                <option key={v} value={v}>
                  Variant: {v}
                </option>
              ))}
            </select>
            <select style={pillInput} value={polarity} onChange={(e) => setPolarity(e.target.value as "default" | "inverse") }>
              <option value="default">Polarity: default</option>
              <option value="inverse">Polarity: inverse</option>
            </select>
          </div>
        )}
      </div>
      <Surface
        polarity={polarity}
        style={{
          background: polarity === "inverse" ? snapshot.globals.color.surface.inverse : snapshot.globals.color.surface.elevated,
          color: polarity === "inverse" ? snapshot.globals.color.text.inverse : snapshot.globals.color.text.primary,
          border: `1px solid ${snapshot.globals.color.border.default}`,
          borderRadius: "16px",
          padding: "24px",
          minHeight: 240,
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {spec ? <PreviewExample componentId={spec.id} style={style} snapshot={snapshot} /> : <ThemePreview snapshot={snapshot} />}
      </Surface>
    </div>
  );
};

type PreviewProps = {
  componentId: string;
  style?: CSSProperties;
  snapshot: DesignSystemSnapshot;
};

const PreviewExample = ({ componentId, style, snapshot }: PreviewProps) => {
  switch (componentId) {
    case "button":
      return (
        <button style={{ ...previewButton, ...style }}>Primary Button</button>
      );
    case "input":
      return <input style={{ ...previewInput, ...style }} placeholder="Type here" />;
    case "card":
      return (
        <div style={{ ...previewCard, ...style }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Card title</div>
          <div style={{ color: "var(--text-muted)" }}>Neutral, elevated container.</div>
        </div>
      );
    case "dropdown":
      return (
        <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 650 }}>Label</span>
          <div style={{ ...selectShell, ...style }}>
            <span>Choose an option</span>
            <span style={caret}>▾</span>
          </div>
        </label>
      );
    case "navbar": {
      return (
        <div style={{ ...bar, ...style }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={dot} />
            <span style={{ fontWeight: 700 }}>Product</span>
            <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>Overview</span>
              <span>Docs</span>
              <span>Pricing</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Sign in</span>
            <button style={{ ...pillButton, background: snapshot.globals.color.accent.primary.base, color: snapshot.globals.color.accent.primary.contrast }}>Get started</button>
          </div>
        </div>
      );
    }
    case "checkbox":
      return (
        <label style={choiceRow}>
          <span style={checkboxBox(style)} />
          <span style={{ fontWeight: 600 }}>Checkbox label</span>
        </label>
      );
    case "radio":
      return (
        <label style={choiceRow}>
          <span style={radioOuter(style)}>
            <span style={radioInner(style)} />
          </span>
          <span style={{ fontWeight: 600 }}>Radio label</span>
        </label>
      );
    case "toggle":
      return (
        <label style={choiceRow}>
          <div style={{ ...toggleTrack(style), position: "relative" }}>
            <div style={toggleKnob(style)} />
          </div>
          <span style={{ fontWeight: 600 }}>Toggle label</span>
        </label>
      );
    case "badge":
      return <span style={{ ...badge, ...style }}>Badge</span>;
    case "avatar":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...avatarCircle, ...style }} />
          <div>
            <div style={{ fontWeight: 700 }}>Alex Kim</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Product Design</div>
          </div>
        </div>
      );
    case "toast":
      return (
        <div style={{ ...toastCard, ...style }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: snapshot.globals.color.accent.primary.base }} />
            <div>
              <div style={{ fontWeight: 700 }}>Saved</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Your changes are live.</div>
            </div>
          </div>
          <button style={ghostButton}>Undo</button>
        </div>
      );
    case "tooltip":
      return (
        <div style={{ display: "grid", gap: 8, placeItems: "center" }}>
          <div style={{ ...tooltipBubble, ...style }}>
            <div>Tooltip text</div>
          </div>
          <div style={{ width: 32, height: 1, background: "var(--border)" }} />
        </div>
      );
    case "modal":
      return (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, ...style }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Modal title</div>
            <div style={{ color: "var(--text-muted)", marginBottom: 12 }}>Supporting text inside a centered panel.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={ghostButton}>Cancel</button>
              <button style={pillButton}>Save</button>
            </div>
          </div>
        </div>
      );
    case "table": {
      return (
        <div style={{ ...tableShell, ...style }}>
          <div style={tableHeader}>
            <span>Name</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {["Row A", "Row B"].map((row, i) => (
            <div key={row} style={{ ...tableRow, background: i % 2 ? "var(--surface)" : "var(--surface-alt)" }}>
              <span>{row}</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Active</span>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>2d ago</span>
            </div>
          ))}
        </div>
      );
    }
    case "footer":
      return (
        <div style={{ ...footerBar, ...style }}>
          <span style={{ fontWeight: 700 }}>Product</span>
          <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      );
    case "list-item":
      return (
        <div style={{ ...listRow, ...style }}>
          <div style={{ ...avatarCircle, width: 36, height: 36 }} />
          <div>
            <div style={{ fontWeight: 700 }}>List item title</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Secondary line</div>
          </div>
        </div>
      );
    case "divider":
      return <div style={{ ...dividerLine, borderColor: style?.borderColor || "var(--border)" }} />;
    case "tabs": {
      const baseCard = {
        borderRadius: "16px",
        padding: "16px",
        border: `1px solid ${snapshot.globals.color.border.default}`,
        background: snapshot.globals.color.surface.elevated,
        boxShadow: snapshot.globals.shadow.sm,
        display: "grid",
        gap: 12
      } as CSSProperties;

      const tabRow = (
        <div style={{ display: "flex", gap: 8 }}>
          {"Overview Activity Settings".split(" ").map((tab, i) => (
            <button
              key={tab}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: i === 0 ? "none" : `1px solid ${snapshot.globals.color.border.subtle}`,
                background: i === 0 ? snapshot.globals.color.accent.primary.base : "transparent",
                color: i === 0 ? snapshot.globals.color.accent.primary.contrast : snapshot.globals.color.text.primary,
                cursor: "pointer",
                boxShadow: i === 0 ? snapshot.globals.shadow.sm : "none"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      );

      return (
        <div style={baseCard}>
          <div style={{ fontWeight: 700 }}>Dashboard</div>
          {tabRow}
          <div style={{ ...previewCard, ...style, borderColor: snapshot.globals.color.border.subtle }}>
            <div style={{ fontWeight: 600 }}>Card title</div>
            <div style={{ color: "var(--text-muted)" }}>Surface context for tabs.</div>
          </div>
        </div>
      );
    }
    default:
      return (
        <div style={{ ...previewCard, ...style }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{componentId}</div>
          <div style={{ color: "var(--text-muted)" }}>Preview placeholder.</div>
        </div>
      );
  }
};

const ThemePreview = ({ snapshot }: { snapshot: DesignSystemSnapshot }) => {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "14px",
          background: snapshot.globals.color.accent.primary.base,
          boxShadow: snapshot.globals.shadow.md
        }}
      />
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Color & Type</div>
        <div style={{ color: "var(--text-muted)" }}>Accent {snapshot.globals.color.accent.primary.base}</div>
        <div style={{ color: "var(--text-muted)" }}>Body size {snapshot.globals.font.size[2]}</div>
      </div>
    </div>
  );
};

const pillInput: CSSProperties = {
  borderRadius: "12px",
  padding: "8px 10px",
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  fontWeight: 600
};

const previewButton: CSSProperties = {
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "var(--shadow-sm)"
};

const previewInput: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  width: "60%",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
};

const previewCard: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid var(--border)",
  minWidth: 260
};

const selectShell: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "10px 12px",
  backgroundColor: "var(--surface-alt)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "var(--shadow-sm)"
};

const caret: CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 700
};

const bar: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  padding: "12px 16px",
  border: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "transparent"
};

const dot: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "var(--text)"
};

const choiceRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10
};

const checkboxBox = (style?: CSSProperties): CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 6,
  border: `2px solid ${style?.borderColor || "var(--border)"}`,
  backgroundColor: style?.backgroundColor || "var(--surface-alt)",
  boxShadow: style?.boxShadow
});

const toggleTrack = (style?: CSSProperties): CSSProperties => ({
  width: 42,
  height: 24,
  borderRadius: 999,
  backgroundColor: style?.backgroundColor || "var(--surface-alt)",
  border: `2px solid ${style?.borderColor || "var(--border)"}`,
  boxShadow: style?.boxShadow,
  transition: "all 160ms ease"
});

const toggleKnob = (style?: CSSProperties): CSSProperties => ({
  position: "absolute",
  top: 2,
  left: style?.color ? 18 : 2,
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: style?.color || "var(--text)",
  transition: "left 160ms ease"
});

const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  backgroundColor: "rgba(15,98,254,0.12)",
  color: "#0f62fe",
  fontWeight: 700,
  border: "1px solid rgba(15,98,254,0.2)"
};

const radioOuter = (style?: CSSProperties): CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: `2px solid ${style?.borderColor || "var(--border)"}`,
  display: "grid",
  placeItems: "center",
  backgroundColor: style?.backgroundColor || "var(--surface-alt)",
  boxShadow: style?.boxShadow
});

const radioInner = (style?: CSSProperties): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: style?.color || "var(--text)"
});

const avatarCircle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #cbd5e1, #e2e8f0)",
  border: "2px solid var(--border)",
  boxShadow: "var(--shadow-sm)"
};

const toastCard: CSSProperties = {
  minWidth: 260,
  borderRadius: 12,
  border: "1px solid var(--border)",
  padding: 12,
  backgroundColor: "var(--surface-alt)",
  boxShadow: "var(--shadow-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
};

const tooltipBubble: CSSProperties = {
  padding: "8px 10px",
  backgroundColor: "#0f172a",
  color: "white",
  borderRadius: 10,
  fontWeight: 600,
  boxShadow: "0 6px 18px rgba(15,23,42,0.25)"
};

const modalBackdrop: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  background: "radial-gradient(circle at 30% 20%, rgba(15,23,42,0.06), transparent 50%)"
};

const modalCard: CSSProperties = {
  minWidth: 260,
  maxWidth: 320,
  borderRadius: 14,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-alt)",
  padding: 16,
  boxShadow: "var(--shadow-md)"
};

const ghostButton: CSSProperties = {
  border: "1px solid var(--border)",
  backgroundColor: "transparent",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 650,
  cursor: "pointer"
};

const pillButton: CSSProperties = {
  border: "none",
  background: "#0f62fe",
  color: "white",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow-sm)"
};

const tableShell: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
  minWidth: 280,
  backgroundColor: "var(--surface-alt)",
  boxShadow: "var(--shadow-sm)"
};

const tableHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: "10px 12px",
  fontWeight: 700,
  backgroundColor: "rgba(15,98,254,0.08)",
  borderBottom: "1px solid var(--border)"
};

const tableRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: "10px 12px",
  gap: 6
};

const footerBar: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  padding: "12px 16px",
  border: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "var(--surface-alt)"
};

const listRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: 12,
  backgroundColor: "var(--surface-alt)",
  boxShadow: "var(--shadow-sm)"
};

const dividerLine: CSSProperties = {
  width: "100%",
  borderTop: "1px solid var(--border)",
  margin: "8px 0"
};

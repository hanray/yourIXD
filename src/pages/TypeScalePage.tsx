import { useMemo, useState, type CSSProperties } from "react";
import { useDesignSystem } from "@state/store";
import { Field } from "@components/forms/Field";
import { Surface } from "@components/common/Surface";

const roles: Array<"display" | "heading" | "subheading" | "body" | "caption" | "label"> = [
  "display",
  "heading",
  "subheading",
  "body",
  "caption",
  "label"
];

const sansPresets = ["SF Pro Text", "Inter", "Neue Haas Grotesk", "Helvetica Neue", "Segoe UI"];

const serifPresets = ["SF Serif", "Georgia", "Times New Roman", "Literata", "Merriweather"];

const monoPresets = ["SFMono-Regular", "JetBrains Mono", "IBM Plex Mono", "Consolas", "Menlo"];

const roleLabel = (r: string) => r[0].toUpperCase() + r.slice(1);

const px = (value: string) => Number.parseFloat(value.replace("px", "")) || 0;
const toPx = (n: number) => `${Math.max(0, Math.round(n))}px`;

const resolvePath = (globals: any, ref: string) => {
  if (!ref) return "";
  if (!ref.includes(".")) return ref;
  const parts = ref.split(".");
  let node: any = globals;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = node[part];
    } else {
      return ref;
    }
  }
  return typeof node === "string" || typeof node === "number" ? node : ref;
};

export const TypeScalePage = () => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const update = useDesignSystem((s) => s.updateGlobalToken);
  const globals = snapshot.globals;
  const [focusRole, setFocusRole] = useState<string>("heading");

  const sizeKeys = useMemo(() => Object.keys(globals.font.size) as Array<keyof typeof globals.font.size>, [globals.font.size]);
  const lineHeightKeys = useMemo(() => Object.keys(globals.lineHeight) as Array<keyof typeof globals.lineHeight>, [globals.lineHeight]);
  const weightKeys = useMemo(() => Object.keys(globals.weight) as Array<keyof typeof globals.weight>, [globals.weight]);

  const specimenStyle = (role: string): CSSProperties => {
    const config = globals.textRole[role as keyof typeof globals.textRole];
    return {
      fontFamily: globals.font.family.sans,
      fontSize: resolvePath(globals, config.size) as string,
      fontWeight: Number(resolvePath(globals, config.weight)) || 400,
      lineHeight: resolvePath(globals, config.lineHeight) as string,
      margin: 0
    };
  };

  const updateSize = (key: string, raw: number) => update(`font.size.${key}`, toPx(raw));
  const updateLineHeight = (key: string, raw: number) => update(`lineHeight.${key}`, toPx(raw));
  const updateWeight = (key: string, raw: number) => update(`weight.${key}`, `${Math.max(100, Math.min(900, Math.round(raw)))}`);

  const optionsWithCurrent = (presets: string[], current: string) =>
    presets.includes(current) ? presets : [current, ...presets];

  return (
    <div style={page}>
      <div style={left}>
        <div style={section}>
          <div style={sectionTitle}>Families</div>
          <div style={simpleGrid}>
            <Field
              label="Sans"
              input={(
                <select style={select} value={globals.font.family.sans} onChange={(e) => update("font.family.sans", e.target.value)}>
                  {optionsWithCurrent(sansPresets, globals.font.family.sans).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            />
            <Field
              label="Serif"
              input={(
                <select style={select} value={globals.font.family.serif} onChange={(e) => update("font.family.serif", e.target.value)}>
                  {optionsWithCurrent(serifPresets, globals.font.family.serif).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            />
            <Field
              label="Mono"
              input={(
                <select style={select} value={globals.font.family.mono} onChange={(e) => update("font.family.mono", e.target.value)}>
                  {optionsWithCurrent(monoPresets, globals.font.family.mono).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>Core sizes</div>
          <div style={listGrid}>
            {sizeKeys.map((key) => (
              <div key={key} style={row}>
                <div style={mini}>{`font.size.${key}`}</div>
                <input
                  type="number"
                  style={input}
                  value={px(globals.font.size[key])}
                  onChange={(e) => updateSize(key, Number(e.target.value))}
                />
                <span style={suffix}>px</span>
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>Line heights</div>
          <div style={listGrid}>
            {lineHeightKeys.map((key) => (
              <div key={key} style={row}>
                <div style={mini}>{`lineHeight.${key}`}</div>
                <input
                  type="number"
                  style={input}
                  value={px(globals.lineHeight[key])}
                  onChange={(e) => updateLineHeight(String(key), Number(e.target.value))}
                />
                <span style={suffix}>px</span>
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>Weights</div>
          <div style={listGrid}>
            {weightKeys.map((key) => (
              <div key={key} style={row}>
                <div style={mini}>{`weight.${key}`}</div>
                <input
                  type="number"
                  style={input}
                  value={globals.weight[key]}
                  onChange={(e) => updateWeight(String(key), Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={section}>
          <div style={sectionTitle}>Text roles</div>
          <div style={{ display: "grid", gap: 10 }}>
            {roles.map((role) => {
              const config = globals.textRole[role];
              return (
                <div key={role} style={roleRow}>
                  <button style={{ ...pill, ...(focusRole === role ? pillActive : {}) }} onClick={() => setFocusRole(role)}>
                    {roleLabel(role)}
                  </button>
                  <select style={select} value={config.size} onChange={(e) => update(`textRole.${role}.size`, e.target.value)}>
                    {sizeKeys.map((k) => (
                      <option key={k} value={`font.size.${k}`}>{`Size ${k}`}</option>
                    ))}
                  </select>
                  <select style={select} value={config.weight} onChange={(e) => update(`textRole.${role}.weight`, e.target.value)}>
                    {weightKeys.map((k) => (
                      <option key={k} value={`weight.${k}`}>{`Weight ${k}`}</option>
                    ))}
                  </select>
                  <select style={select} value={config.lineHeight} onChange={(e) => update(`textRole.${role}.lineHeight`, e.target.value)}>
                    {lineHeightKeys.map((k) => (
                      <option key={k} value={`lineHeight.${k}`}>{`Line ${k}`}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={right}>
        <div style={previewHeader}>
          <div>
            <div style={sectionTitle}>Type specimens</div>
            <div style={muted}>Default and inverse contexts. Click a role to focus.</div>
          </div>
        </div>
        <div style={specimenGrid}>
          <Surface polarity="default" style={specimenSurface(globals.color.surface.elevated, globals.color.text.primary, globals.color.border.subtle)}>
            <SpecimenContent globals={globals} focusRole={focusRole} specimenStyle={specimenStyle} />
          </Surface>
          <Surface polarity="inverse" style={specimenSurface(globals.color.surface.inverse, globals.color.text.inverse, globals.color.border.subtle)}>
            <SpecimenContent globals={globals} focusRole={focusRole} specimenStyle={specimenStyle} inverse />
          </Surface>
        </div>
      </div>
    </div>
  );
};

const SpecimenContent = ({ globals, focusRole, specimenStyle, inverse = false }: {
  globals: any;
  focusRole: string;
  specimenStyle: (role: string) => CSSProperties;
  inverse?: boolean;
}) => {
  const text = globals.color.text;
  const sub = inverse ? text.inverse : text.secondary;
  const body = inverse ? text.inverse : text.primary;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {roles.map((role) => (
        <div key={role} style={{ display: "grid", gap: 4, padding: 6, borderRadius: 10, background: focusRole === role ? (inverse ? "rgba(255,255,255,0.08)" : "rgba(15,98,254,0.06)") : "transparent" }}>
          <div style={{ ...specimenStyle(role), color: body, transition: "transform 160ms ease", transform: focusRole === role ? "translateY(-1px)" : "none" }}>
            {role === "display" ? "Display — expressive headline" : roleLabel(role)}
          </div>
          {role === "body" ? (
            <p style={{ ...specimenStyle(role), color: sub, margin: 0 }}>
              Multi-line body copy for rhythm. We test how the line height breathes and whether the weight stays readable across surfaces.
            </p>
          ) : (
            <div style={{ color: sub, fontSize: "13px", fontWeight: 600 }}>{specimenMeta(globals, role)}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const specimenMeta = (globals: any, role: string) => {
  const config = globals.textRole[role];
  return `${config.size} / ${config.lineHeight} · ${config.weight}`;
};

const page: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, 0.9fr) 1.1fr",
  gap: 16,
  height: "100%",
  padding: 16
};

const left: CSSProperties = {
  display: "grid",
  gap: 12,
  alignContent: "start",
  background: "var(--surface)",
  padding: 12,
  borderRadius: 14,
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)"
};

const right: CSSProperties = {
  display: "grid",
  gap: 12,
  minHeight: 0
};

const section: CSSProperties = {
  display: "grid",
  gap: 8
};

const sectionTitle: CSSProperties = {
  fontWeight: 800,
  fontSize: 16
};

const simpleGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 8
};

const listGrid: CSSProperties = {
  display: "grid",
  gap: 8
};

const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 120px auto",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  borderRadius: 10,
  background: "var(--surface-alt)",
  border: "1px solid var(--border)"
};

const roleRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px repeat(3, minmax(120px, 1fr))",
  gap: 8,
  alignItems: "center",
  padding: "6px 8px",
  borderRadius: 10,
  background: "var(--surface-alt)",
  border: "1px solid var(--border)"
};

const input: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
};

const select: CSSProperties = {
  ...input,
  appearance: "none"
};

const suffix: CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 650
};

const mini: CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  fontWeight: 700
};

const pill: CSSProperties = {
  border: "1px solid var(--border)",
  background: "transparent",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer"
};

const pillActive: CSSProperties = {
  background: "rgba(15,98,254,0.12)",
  color: "#0f62fe",
  borderColor: "rgba(15,98,254,0.3)"
};

const previewHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const muted: CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 600,
  fontSize: 13
};

const specimenGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  minHeight: 0
};

const specimenSurface = (bg: string, fg: string, border: string): CSSProperties => ({
  background: bg,
  color: fg,
  border: `1px solid ${border}`,
  borderRadius: 16,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
  minHeight: 320
});

export default TypeScalePage;

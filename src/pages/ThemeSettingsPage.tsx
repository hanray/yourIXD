import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useDesignSystem } from "@state/store";
import { persistence, SnapshotMeta } from "@state/persistence";
import { Panel } from "@components/common/Panel";
import { Field } from "@components/forms/Field";
import { LivePreview } from "@components/editor/LivePreview";

type Rgba = { r: number; g: number; b: number; a: number };

const pxValue = (value: string) => Number.parseFloat(value.replace("px", ""));
const msValue = (value: string) => Number.parseFloat(value.replace("ms", ""));
const toPx = (value: number) => `${Math.max(0, Math.round(value))}px`;
const toMs = (value: number) => `${Math.max(0, Math.round(value))}ms`;

const parseColor = (value: string): Rgba | null => {
  if (!value) return null;
  const hex = value.trim();
  const shortHex = /^#([a-f0-9]{3})$/i;
  const longHex = /^#([a-f0-9]{6})$/i;
  const rgb = /^rgba?\(([^)]+)\)$/i;

  if (shortHex.test(hex)) {
    const [, raw] = shortHex.exec(hex)!;
    const r = Number.parseInt(raw[0] + raw[0], 16);
    const g = Number.parseInt(raw[1] + raw[1], 16);
    const b = Number.parseInt(raw[2] + raw[2], 16);
    return { r, g, b, a: 1 };
  }

  if (longHex.test(hex)) {
    const [, raw] = longHex.exec(hex)!;
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  if (rgb.test(value)) {
    const [, content] = rgb.exec(value)!;
    const parts = content.split(",").map((p) => p.trim());
    const [r, g, b, a] = parts.map((p, i) => (i === 3 ? Number.parseFloat(p) : Number.parseInt(p, 10)));
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a: Number.isNaN(a) ? 1 : Math.min(1, Math.max(0, a)) };
  }

  return null;
};

const compositeOver = (fg: Rgba, bg: Rgba): Rgba => {
  const alpha = fg.a;
  const r = fg.r * alpha + bg.r * (1 - alpha);
  const g = fg.g * alpha + bg.g * (1 - alpha);
  const b = fg.b * alpha + bg.b * (1 - alpha);
  return { r, g, b, a: 1 };
};

const luminance = (color: Rgba) => {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const comp = [color.r, color.g, color.b].map(toLinear);
  return 0.2126 * comp[0] + 0.7152 * comp[1] + 0.0722 * comp[2];
};

const contrastRatio = (fg: string, bg: string): number | null => {
  const fgColor = parseColor(fg);
  const bgColor = parseColor(bg);
  if (!fgColor || !bgColor) return null;
  const composed = fgColor.a < 1 ? compositeOver(fgColor, bgColor) : fgColor;
  const L1 = luminance(composed);
  const L2 = luminance(bgColor);
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
};

const safeHex = (value: string, fallback = "#000000") => {
  const hex = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
  return hex.test(value.trim()) ? value.trim() : fallback;
};

const StepperInput = ({
  value,
  min,
  step = 1,
  onChange
}: {
  value: number;
  min?: number;
  step?: number;
  onChange: (next: number) => void;
}) => (
  <div style={stepperWrap}>
    <input
      type="number"
      style={inputStyle}
      value={Number.isFinite(value) ? value : 0}
      min={min}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <div style={stepperButtons}>
      <button style={pillButton} onClick={() => onChange((value || 0) - step)}>-</button>
      <button style={pillButton} onClick={() => onChange((value || 0) + step)}>+</button>
    </div>
  </div>
);

const ColorRoleRow = ({
  label,
  path,
  value,
  onChange
}: {
  label: string;
  path: string;
  value: string;
  onChange: (path: string, next: string | number | undefined) => void;
}) => (
  <div style={colorRow}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
      <div style={{ width: 36, height: 24, borderRadius: 8, border: "1px solid var(--border)", background: value }} />
      <div style={{ fontWeight: 600 }}>{label}</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <input
        aria-label={`${label} color swatch`}
        type="color"
        style={colorInput}
        value={safeHex(value)}
        onChange={(e) => onChange(path, e.target.value)}
      />
      <input
        aria-label={`${label} hex`}
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(path, e.target.value)}
      />
    </div>
  </div>
);

export const ThemeSettingsPage = () => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const update = useDesignSystem((s) => s.updateGlobalToken);
  const saveSnapshot = useDesignSystem((s) => s.saveSnapshot);
  const loadSnapshot = useDesignSystem((s) => s.loadSnapshot);
  const duplicateSnapshot = useDesignSystem((s) => s.duplicateSnapshot);

  const [name, setName] = useState(snapshot.name);
  const [description, setDescription] = useState(snapshot.description ?? "");
  const [available, setAvailable] = useState<SnapshotMeta[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<string>("");
  const [webFontFamily, setWebFontFamily] = useState(snapshot.globals.font.web?.family ?? snapshot.globals.font.family.sans);
  const [webFontSource, setWebFontSource] = useState(snapshot.globals.font.web?.source ?? "");
  const [webFontKind, setWebFontKind] = useState<"url" | "google">(snapshot.globals.font.web?.kind ?? "url");
  const basicFontOptions = [
    "Inter",
    "Arial",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "SF Pro Text"
  ];
  const [basicFont, setBasicFont] = useState(snapshot.globals.font.family.sans);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    setAvailable(persistence.list());
    setName(snapshot.name);
    setDescription(snapshot.description ?? "");
  }, [snapshot.id, snapshot.name, snapshot.description]);

  useEffect(() => {
    const currentSans = snapshot.globals.font.family.sans;
    setWebFontFamily(snapshot.globals.font.web?.family ?? currentSans);
    setWebFontSource(snapshot.globals.font.web?.source ?? "");
    setWebFontKind(snapshot.globals.font.web?.kind ?? "url");
    setBasicFont(currentSans);
  }, [snapshot.globals.font.web, snapshot.globals.font.family.sans]);

  useEffect(() => {
    const web = snapshot.globals.font.web;
    if (!web || !web.family || !web.source) return;
    const style = document.createElement("style");
    style.setAttribute("data-ds-webfont", "active");
    const format = web.source.endsWith("woff") ? "woff" : "woff2";
    style.textContent = web.kind === "google"
      ? `@import url('${web.source}');`
      : `@font-face { font-family: '${web.family}'; src: url('${web.source}') format('${format}'); font-weight: 100 900; font-display: swap; }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [snapshot.globals.font.web]);

  const textRoleOptions = useMemo(() => Object.keys(snapshot.globals.textRole), [snapshot.globals.textRole]);
  const fontSizeKeys = useMemo(() => Object.keys(snapshot.globals.font.size), [snapshot.globals.font.size]);
  const lineHeightKeys = useMemo(() => Object.keys(snapshot.globals.lineHeight), [snapshot.globals.lineHeight]);
  const weightKeys = useMemo(() => Object.keys(snapshot.globals.weight), [snapshot.globals.weight]);
  const spaceKeys = useMemo(() => Object.keys(snapshot.globals.space).sort((a, b) => Number(a) - Number(b)), [snapshot.globals.space]);
  const radiusKeys = useMemo(() => Object.keys(snapshot.globals.radius), [snapshot.globals.radius]);
  const shadowKeys = useMemo(() => Object.keys(snapshot.globals.shadow), [snapshot.globals.shadow]);

  const contrastAlerts = useMemo(() => {
    const g = snapshot.globals.color;
    const pairs = [
      { label: "Text primary on surface base", fg: g.text.primary, bg: g.surface.base },
      { label: "Text secondary on surface base", fg: g.text.secondary, bg: g.surface.base },
      { label: "Text muted on surface subtle", fg: g.text.muted, bg: g.surface.subtle },
      { label: "Text inverse on surface inverse", fg: g.text.inverse, bg: g.surface.inverse },
      { label: "Accent contrast on accent base", fg: g.accent.primary.contrast, bg: g.accent.primary.base },
      { label: "Danger contrast on danger base", fg: g.danger.contrast, bg: g.danger.base }
    ];

    return pairs
      .map((p) => ({ ...p, ratio: contrastRatio(p.fg, p.bg) }))
      .filter((p) => p.ratio !== null && (p.ratio as number) < 4.5)
      .map((p) => ({ label: p.label, ratio: p.ratio as number }));
  }, [snapshot.globals.color]);

  const updateSpace = (key: string, raw: number) => {
    const idx = spaceKeys.indexOf(key);
    const min = idx > 0 ? pxValue(snapshot.globals.space[spaceKeys[idx - 1]]) + 1 : 0;
    const next = Number.isFinite(raw) ? Math.max(raw, min) : min;
    update(`space.${key}`, toPx(next));
  };

  const updateRadius = (key: string, raw: number) => {
    const next = Number.isFinite(raw) ? Math.max(raw, 0) : 0;
    update(`radius.${key}`, toPx(next));
  };

  const updateDuration = (key: string, raw: number) => {
    const next = Number.isFinite(raw) ? Math.max(raw, 0) : 0;
    update(`motion.duration.${key}`, toMs(next));
  };

  const applyWebFont = () => {
    const family = (webFontFamily || basicFont || "").trim();
    const source = webFontSource.trim();

    if (!family) {
      console.info('[UI] Load font skipped: no family provided');
      return;
    }

    if (source) {
      console.info('[UI] Load font (remote)', { family, source, kind: webFontKind });
      update("font.web.family", family);
      update("font.web.source", source);
      update("font.web.kind", webFontKind);
      update("font.family.sans", family);
      return;
    }

    console.info('[UI] Load font (basic selection)', { family });
    update("font.web.family", undefined);
    update("font.web.source", undefined);
    update("font.web.kind", undefined);
    update("font.family.sans", family);
    setWebFontFamily(family);
  };

  const labelize = (key: string) => key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const customColors = useMemo(() => {
    const color = snapshot.globals.color as any;
    const derive = (obj: Record<string, unknown>, baseKeys: string[]) =>
      Object.keys(obj || {})
        .filter((k) => !baseKeys.includes(k))
        .reduce<Record<string, string>>((acc, key) => {
          acc[key] = labelize(key);
          return acc;
        }, {});

    return {
      surface: derive(color.surface || {}, ["base", "subtle", "elevated", "inverse"]),
      text: derive(color.text || {}, ["primary", "secondary", "muted", "inverse", "disabled"]),
      accent: derive(color.accent || {}, ["primary"]),
      danger: derive(color.danger || {}, ["base", "hover", "active", "contrast"]),
      border: derive(color.border || {}, ["default", "subtle", "focus", "danger"])
    };
  }, [snapshot.globals.color]);

  const addCustomColor = (section: string) => {
    const name = prompt(`Enter name for new ${section.toLowerCase()} color role:`);
    if (!name || !name.trim()) return;
    const key = name.trim().toLowerCase().replace(/\s+/g, "-");
    const path = `color.${section.toLowerCase()}.${key}`;
    update(path, "#000000");
  };

  const removeCustomColor = (section: string, key: string) => {
    const path = `color.${section.toLowerCase()}.${key}`;
    update(path, undefined);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", height: "100%" }}>
      <div style={{ padding: 20, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel title="Snapshot">
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="Name" input={<input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />} />
            <Field label="Description" input={<input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={buttonPrimary} onClick={() => saveSnapshot({ name, description })}>Save Snapshot</button>
              <button style={buttonGhost} onClick={() => duplicateSnapshot(`${name} Copy`)}>Duplicate</button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select style={{ ...inputStyle, flex: 1, minWidth: 200 }} value={selectedLoad} onChange={(e) => setSelectedLoad(e.target.value)}>
                <option value="">Select snapshot to load</option>
                {available.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.name}
                  </option>
                ))}
              </select>
              <button style={buttonSecondary} disabled={!selectedLoad} onClick={() => selectedLoad && loadSnapshot(selectedLoad)}>
                Load
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Color roles">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={subtleHeader}>Surfaces</div>
            <ColorRoleRow label="Base" path="color.surface.base" value={snapshot.globals.color.surface.base} onChange={update} />
            <ColorRoleRow label="Subtle" path="color.surface.subtle" value={snapshot.globals.color.surface.subtle} onChange={update} />
            <ColorRoleRow label="Elevated" path="color.surface.elevated" value={snapshot.globals.color.surface.elevated} onChange={update} />
            <ColorRoleRow label="Inverse" path="color.surface.inverse" value={snapshot.globals.color.surface.inverse} onChange={update} />
            {customColors.surface && Object.entries(customColors.surface).map(([key, label]) => {
              const value = (snapshot.globals.color as any).surface?.[key] || "#000000";
              return (
                <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ColorRoleRow label={label} path={`color.surface.${key}`} value={value} onChange={update} />
                  <button style={iconButton} onClick={() => removeCustomColor("surface", key)} title="Remove">
                    ×
                  </button>
                </div>
              );
            })}
            <button style={addButton} onClick={() => addCustomColor("surface")}>+ Add color</button>

            <div style={subtleHeader}>Text</div>
            <ColorRoleRow label="Primary" path="color.text.primary" value={snapshot.globals.color.text.primary} onChange={update} />
            <ColorRoleRow label="Secondary" path="color.text.secondary" value={snapshot.globals.color.text.secondary} onChange={update} />
            <ColorRoleRow label="Muted" path="color.text.muted" value={snapshot.globals.color.text.muted} onChange={update} />
            <ColorRoleRow label="Inverse" path="color.text.inverse" value={snapshot.globals.color.text.inverse} onChange={update} />
            <ColorRoleRow label="Disabled" path="color.text.disabled" value={snapshot.globals.color.text.disabled} onChange={update} />
            {customColors.text && Object.entries(customColors.text).map(([key, label]) => {
              const value = (snapshot.globals.color as any).text?.[key] || "#000000";
              return (
                <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ColorRoleRow label={label} path={`color.text.${key}`} value={value} onChange={update} />
                  <button style={iconButton} onClick={() => removeCustomColor("text", key)} title="Remove">
                    ×
                  </button>
                </div>
              );
            })}
            <button style={addButton} onClick={() => addCustomColor("text")}>+ Add color</button>

            <div style={subtleHeader}>Accent</div>
            <ColorRoleRow label="Accent base" path="color.accent.primary.base" value={snapshot.globals.color.accent.primary.base} onChange={update} />
            <ColorRoleRow label="Accent hover" path="color.accent.primary.hover" value={snapshot.globals.color.accent.primary.hover} onChange={update} />
            <ColorRoleRow label="Accent active" path="color.accent.primary.active" value={snapshot.globals.color.accent.primary.active} onChange={update} />
            <ColorRoleRow label="Accent contrast" path="color.accent.primary.contrast" value={snapshot.globals.color.accent.primary.contrast} onChange={update} />
            {customColors.accent && Object.entries(customColors.accent).map(([key, label]) => {
              const value = (snapshot.globals.color as any).accent?.[key] || "#000000";
              return (
                <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ColorRoleRow label={label} path={`color.accent.${key}`} value={value} onChange={update} />
                  <button style={iconButton} onClick={() => removeCustomColor("accent", key)} title="Remove">
                    ×
                  </button>
                </div>
              );
            })}
            <button style={addButton} onClick={() => addCustomColor("accent")}>+ Add color</button>

            <div style={subtleHeader}>Danger</div>
            <ColorRoleRow label="Danger base" path="color.danger.base" value={snapshot.globals.color.danger.base} onChange={update} />
            <ColorRoleRow label="Danger hover" path="color.danger.hover" value={snapshot.globals.color.danger.hover} onChange={update} />
            <ColorRoleRow label="Danger active" path="color.danger.active" value={snapshot.globals.color.danger.active} onChange={update} />
            <ColorRoleRow label="Danger contrast" path="color.danger.contrast" value={snapshot.globals.color.danger.contrast} onChange={update} />
            {customColors.danger && Object.entries(customColors.danger).map(([key, label]) => {
              const value = (snapshot.globals.color as any).danger?.[key] || "#000000";
              return (
                <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ColorRoleRow label={label} path={`color.danger.${key}`} value={value} onChange={update} />
                  <button style={iconButton} onClick={() => removeCustomColor("danger", key)} title="Remove">
                    ×
                  </button>
                </div>
              );
            })}
            <button style={addButton} onClick={() => addCustomColor("danger")}>+ Add color</button>

            <div style={subtleHeader}>Borders</div>
            <ColorRoleRow label="Default" path="color.border.default" value={snapshot.globals.color.border.default} onChange={update} />
            <ColorRoleRow label="Subtle" path="color.border.subtle" value={snapshot.globals.color.border.subtle} onChange={update} />
            <ColorRoleRow label="Focus" path="color.border.focus" value={snapshot.globals.color.border.focus} onChange={update} />
            <ColorRoleRow label="Danger" path="color.border.danger" value={snapshot.globals.color.border.danger} onChange={update} />
            {customColors.border && Object.entries(customColors.border).map(([key, label]) => {
              const value = (snapshot.globals.color as any).border?.[key] || "#000000";
              return (
                <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ColorRoleRow label={label} path={`color.border.${key}`} value={value} onChange={update} />
                  <button style={iconButton} onClick={() => removeCustomColor("border", key)} title="Remove">
                    ×
                  </button>
                </div>
              );
            })}
            <button style={addButton} onClick={() => addCustomColor("border")}>+ Add color</button>

            {contrastAlerts.length > 0 && (
              <div style={alertBox}>
                {contrastAlerts.map((c) => (
                  <div key={c.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>⚠ {c.label}</span>
                    <span style={{ fontWeight: 700 }}>{c.ratio.toFixed(2)}:1</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Typography">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={subtleHeader}>Web font loader</div>
            <div style={{ display: "grid", gap: 10 }}>
              <Field
                label="Basic font (no URL)"
                input={(
                  <select
                    style={inputStyle}
                    value={basicFont}
                    onChange={(e) => {
                      const next = e.target.value;
                      setBasicFont(next);
                      setWebFontFamily(next);
                      setWebFontSource("");
                    }}
                  >
                    {basicFontOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
              />
              <Field label="Font family name" input={<input style={inputStyle} value={webFontFamily} onChange={(e) => setWebFontFamily(e.target.value)} />} />
              <Field
                label="Source (URL or Google import)"
                input={<input style={inputStyle} value={webFontSource} onChange={(e) => setWebFontSource(e.target.value)} placeholder="https://...woff2 or https://fonts.googleapis.com/..." />}
              />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={radioLabel}>
                  <input type="radio" name="fontKind" checked={webFontKind === "url"} onChange={() => setWebFontKind("url")} style={radioInput} />
                  File URL
                </label>
                <label style={radioLabel}>
                  <input type="radio" name="fontKind" checked={webFontKind === "google"} onChange={() => setWebFontKind("google")} style={radioInput} />
                  Google import
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={buttonPrimary} onClick={applyWebFont}>Load font</button>
              </div>
            </div>

            <div style={subtleHeader}>Text roles → scale</div>
            <div style={{ display: "grid", gap: 10 }}>
              {textRoleOptions.map((role) => {
                const config = snapshot.globals.textRole[role];
                return (
                  <div key={role} style={textRoleRow}>
                    <div style={{ fontWeight: 600, minWidth: 110 }}>{role}</div>
                    <select
                      style={inputStyle}
                      value={config.size}
                      onChange={(e) => update(`textRole.${role}.size`, e.target.value)}
                    >
                      {fontSizeKeys.map((k) => (
                        <option key={k} value={`font.size.${k}`}>
                          Size {k}
                        </option>
                      ))}
                    </select>
                    <select
                      style={inputStyle}
                      value={config.lineHeight}
                      onChange={(e) => update(`textRole.${role}.lineHeight`, e.target.value)}
                    >
                      {lineHeightKeys.map((k) => (
                        <option key={k} value={`lineHeight.${k}`}>
                          Line {k}
                        </option>
                      ))}
                    </select>
                    <select
                      style={inputStyle}
                      value={config.weight}
                      onChange={(e) => update(`textRole.${role}.weight`, e.target.value)}
                    >
                      {weightKeys.map((k) => (
                        <option key={k} value={`weight.${k}`}>
                          Weight {k}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  style={inputStyle}
                  placeholder="New role name (e.g., 'hero')"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <button
                  style={buttonPrimary}
                  onClick={() => {
                    if (newRoleName && !snapshot.globals.textRole[newRoleName]) {
                      update(`textRole.${newRoleName}.size`, 'font.size.2');
                      update(`textRole.${newRoleName}.weight`, 'weight.regular');
                      update(`textRole.${newRoleName}.lineHeight`, 'lineHeight.normal');
                      setNewRoleName('');
                    }
                  }}
                  disabled={!newRoleName || !!snapshot.globals.textRole[newRoleName]}
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Spacing scale">
          <div style={{ display: "grid", gap: 12 }}>
            {spaceKeys.map((key, idx) => (
              <div key={key} style={scaleRow}>
                <div style={{ fontWeight: 600, minWidth: 80 }}>space.{key}</div>
                <StepperInput
                  value={pxValue(snapshot.globals.space[key])}
                  min={idx === 0 ? 0 : pxValue(snapshot.globals.space[spaceKeys[idx - 1]]) + 1}
                  onChange={(n) => updateSpace(key, n)}
                />
                <div style={mutedText}>{snapshot.globals.space[key]}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Radius scale">
          <div style={{ display: "grid", gap: 12 }}>
            {radiusKeys.map((key) => (
              <div key={key} style={scaleRow}>
                <div style={{ fontWeight: 600, minWidth: 80 }}>radius.{key}</div>
                <StepperInput value={pxValue(snapshot.globals.radius[key])} min={0} onChange={(n) => updateRadius(key, n)} />
                <div style={mutedText}>{snapshot.globals.radius[key]}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Shadow scale">
          <div style={{ display: "grid", gap: 12 }}>
            {shadowKeys.map((key) => (
              <div key={key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>shadow.{key}</span>
                <input
                  style={inputStyle}
                  value={snapshot.globals.shadow[key]}
                  onChange={(e) => update(`shadow.${key}`, e.target.value)}
                  placeholder="0 2px 8px rgba(0,0,0,0.08)"
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Motion">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={subtleHeader}>Duration (ms)</div>
            {Object.entries(snapshot.globals.motion.duration).map(([key, value]) => (
              <div key={key} style={scaleRow}>
                <div style={{ fontWeight: 600, minWidth: 100 }}>duration.{key}</div>
                <StepperInput value={msValue(value)} min={0} step={20} onChange={(n) => updateDuration(key, n)} />
                <div style={mutedText}>{value}</div>
              </div>
            ))}

            <div style={subtleHeader}>Easing</div>
            {Object.entries(snapshot.globals.motion.easing).map(([key, value]) => (
              <div key={key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>easing.{key}</span>
                <input style={inputStyle} value={value} onChange={(e) => update(`motion.easing.${key}`, e.target.value)} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <LivePreview />
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
};

const buttonPrimary: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "var(--shadow-sm)"
};

const buttonSecondary: CSSProperties = {
  ...buttonPrimary,
  background: "var(--surface-alt)",
  fontWeight: 600
};

const buttonGhost: CSSProperties = {
  ...buttonSecondary,
  background: "transparent"
};

const colorInput: CSSProperties = {
  width: 44,
  height: 38,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)"
};

const colorRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.6)",
  border: "1px solid var(--border)"
};

const stepperWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%"
};

const stepperButtons: CSSProperties = {
  display: "flex",
  gap: 6
};

const pillButton: CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 700
};

const subtleHeader: CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 700,
  marginTop: 6
};

const alertBox: CSSProperties = {
  border: "1px solid #f59e0b",
  background: "#fff7ed",
  color: "#92400e",
  borderRadius: 12,
  padding: 12,
  display: "grid",
  gap: 6
};

const addButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px dashed var(--border)",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 650,
  color: "var(--text-muted)",
  transition: "all 160ms ease"
};

const iconButton: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
  transition: "all 160ms ease"
};

const radioLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  fontWeight: 600
};

const radioInput: CSSProperties = {
  accentColor: "#0f62fe",
  width: 16,
  height: 16
};

const textRoleRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 8,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.6)"
};

const scaleRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr auto",
  alignItems: "center",
  gap: 10
};

const mutedText: CSSProperties = {
  color: "var(--text-muted)",
  fontWeight: 600
};

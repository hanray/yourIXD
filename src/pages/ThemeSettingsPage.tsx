import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useDesignSystem } from "@state/store";
import { persistence, SnapshotMeta } from "@state/persistence";
import { Panel } from "@components/common/Panel";
import { Field } from "@components/forms/Field";
import { LivePreview } from "@components/editor/LivePreview";
import type { LoadingPresetKind } from "@models/designSystem";

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

const msNumber = (value?: string) => {
  if (!value) return 0;
  const n = Number.parseFloat(String(value).replace("ms", ""));
  return Number.isFinite(n) ? n : 0;
};

const fallbackLoadingPresets = {
  skeleton: { kind: "skeleton" },
  progress: { kind: "progress" },
  dots: { kind: "dots" },
  shimmer: { kind: "shimmer" },
  "fade-stack": { kind: "fade-stack" },
  "pulse-bar": { kind: "pulse-bar" },
  "slide-up": { kind: "slide-up" },
  "orbit-dots": { kind: "orbit-dots" }
} as const;

type LoadingPresetResolved = { id: string; kind: LoadingPresetKind; color: string };

const resolveLoadingPreset = (
  motion: { color?: string; defaultPreset?: string; presets?: Record<string, { kind: LoadingPresetKind; color?: string }> },
  presetId?: string
): LoadingPresetResolved => {
  const presets = motion?.presets ?? fallbackLoadingPresets;
  const requested = presetId && (presets as any)[presetId] ? presetId : undefined;
  const id = requested ?? motion?.defaultPreset ?? "skeleton";
  const preset = (presets as any)[id] ?? fallbackLoadingPresets.skeleton;
  const color = motion?.color || ("color" in preset ? preset.color : undefined) || "#e7f0ff";
  return { id, kind: preset.kind, color };
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
  const [loadStatus, setLoadStatus] = useState<"idle" | "success" | "error">("idle");
  const [motionPreviewSeed, setMotionPreviewSeed] = useState(0);

  useEffect(() => {
    setAvailable(persistence.list());
    setName(snapshot.name);
    setDescription(snapshot.description ?? "");
  }, [snapshot.id, snapshot.name, snapshot.description]);

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

  const labelize = (key: string) => key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleLoadSnapshot = () => {
    if (!selectedLoad) return;
    try {
      loadSnapshot(selectedLoad);
      setLoadStatus("success");
      setTimeout(() => setLoadStatus("idle"), 3000);
    } catch (err) {
      console.error('[UI] Failed to load snapshot:', err);
      setLoadStatus("error");
      setTimeout(() => setLoadStatus("idle"), 3000);
    }
  };

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

  const loadingMotionRaw = snapshot.globals.motion.loading;
  const loadingMotion = {
    color: loadingMotionRaw?.color ?? "#e7f0ff",
    defaultPreset: loadingMotionRaw?.defaultPreset ?? "skeleton",
    presets: loadingMotionRaw?.presets ?? fallbackLoadingPresets
  };

  const loadingPresets = loadingMotion.presets ?? fallbackLoadingPresets;
  const loadingPresetOptions = Object.keys(loadingPresets);
  const currentLoadingPreset = resolveLoadingPreset(loadingMotion, loadingMotion.defaultPreset);

  const presetLabel = (name: string) => {
    const map: Record<string, string> = {
      skeleton: "Skeleton shimmer",
      progress: "Loading bar",
      dots: "3 dots (sine)",
      shimmer: "Gradient shimmer",
      "fade-stack": "Fade stack",
      "pulse-bar": "Pulse bar",
      "slide-up": "Slide-up tiles",
      "orbit-dots": "Orbit dots"
    };
    return map[name] ?? name;
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
              <button style={buttonSecondary} disabled={!selectedLoad} onClick={handleLoadSnapshot}>
                Load
              </button>
            </div>
            {loadStatus !== "idle" && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: loadStatus === "success" ? "#d4edda" : "#f8d7da",
                color: loadStatus === "success" ? "#155724" : "#721c24",
                border: `1px solid ${loadStatus === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                fontWeight: 600,
                fontSize: 14
              }}>
                {loadStatus === "success" ? "✓ Snapshot loaded successfully" : "✗ Failed to load snapshot"}
              </div>
            )}
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

            <div style={subtleHeader}>Loading animation</div>
            <div style={{ display: "grid", gap: 12 }}>
              <Field
                label="Skeleton color"
                input={(
                  <input
                    type="color"
                    aria-label="Skeleton color"
                    style={{ ...inputStyle, width: 80, padding: 4 }}
                    value={loadingMotion.color}
                    onChange={(e) => {
                      const next = e.target.value;
                      update("motion.loading.color", next);
                      update("motion.loading.presets.skeleton.color", next);
                    }}
                  />
                )}
              />

              <Field
                label="Default loading preset"
                input={(
                  <select
                    style={inputStyle}
                    value={loadingMotion.defaultPreset}
                    onChange={(e) => update("motion.loading.defaultPreset", e.target.value)}
                  >
                    {loadingPresetOptions.map((name) => (
                      <option key={name} value={name}>
                        {presetLabel(name)}
                      </option>
                    ))}
                  </select>
                )}
              />

              <div style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>
                Pick a default animation for all components. Individual components can override this under the Loading state.
              </div>
            </div>

            <div style={subtleHeader}>Preview</div>
            <div style={motionPreviewBox} key={motionPreviewSeed}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 700 }}>Loading preview</span>
                  <span style={{ fontWeight: 600, color: "var(--text-muted)", textTransform: "capitalize" }}>{currentLoadingPreset.id}</span>
                </div>
                <button style={buttonPrimary} onClick={() => setMotionPreviewSeed((n) => n + 1)}>Replay</button>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <LoadingPreviewRow
                  label="Card"
                  preset={currentLoadingPreset}
                  duration={snapshot.globals.motion.duration}
                  easing={snapshot.globals.motion.easing.standard}
                />
                <LoadingPreviewRow
                  label="Form"
                  preset={currentLoadingPreset}
                  duration={snapshot.globals.motion.duration}
                  easing={snapshot.globals.motion.easing.standard}
                  layout="split"
                />
                <LoadingPreviewRow
                  label="Button row"
                  preset={currentLoadingPreset}
                  duration={snapshot.globals.motion.duration}
                  easing={snapshot.globals.motion.easing.standard}
                  layout="buttons"
                />
              </div>
            </div>
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

const motionPreviewBox: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 12,
  background: "var(--surface-alt)",
  display: "grid",
  gap: 12
};

const stepperWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8
};

const stepperButtons: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 32px)",
  gap: 4
};

const pillButton: CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--surface)",
  borderRadius: 10,
  padding: "6px 0",
  cursor: "pointer",
  fontWeight: 700
};

const colorRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.6)"
};

const loadingTile: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 12,
  background: "var(--surface)",
  boxShadow: "var(--shadow-sm)",
  display: "grid",
  gap: 10
};

const loadingBarRow = (color: string, width: string, duration: string, easing: string): CSSProperties => ({
  height: 12,
  width,
  borderRadius: 10,
  background: color,
  animation: `ds-pulse ${duration} ${easing} infinite alternate`
});

const LoadingPreviewRow = ({
  label,
  preset,
  duration,
  easing,
  layout
}: {
  label: string;
  preset: LoadingPresetResolved;
  duration: { fast: string; normal: string; slow: string };
  easing: string;
  layout?: "split" | "buttons";
}) => {
  const dotDurationMs = Math.max(900, Math.round((msNumber(duration.slow) || 320) * 3));
  const dotDuration = `${dotDurationMs}ms`;

  const renderSkeleton = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Skeleton</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={loadingBarRow(preset.color, "72%", duration.slow || "320ms", easing)} />
        <div style={loadingBarRow(preset.color, layout === "split" ? "48%" : "54%", duration.normal || "200ms", easing)} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, ...loadingBarRow(preset.color, "100%", duration.fast || "120ms", easing) }} />
          {layout !== "buttons" && <div style={{ flex: 1, ...loadingBarRow(preset.color, "100%", duration.fast || "120ms", easing) }} />}
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading bar</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: `${preset.color}22`, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div
          style={{
            width: "70%",
            height: "100%",
            background: preset.color,
            borderRadius: "inherit",
            animation: `ds-progress-sweep ${duration.slow || "320ms"} ${easing} infinite`
          }}
        />
      </div>
    </div>
  );

  const renderDots = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>3 dots</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 28 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: preset.color,
              display: "inline-block",
              animation: `ds-dots ${dotDuration} ease-in-out ${i * 140}ms infinite`
            }}
          />
        ))}
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading</span>
      </div>
    </div>
  );

  const renderShimmer = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Gradient shimmer</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 10,
              background: `linear-gradient(120deg, ${preset.color}22, ${preset.color}66, ${preset.color}22)`,
              backgroundSize: "200% 100%",
              animation: `ds-shimmer ${duration.slow || "320ms"} ${easing} infinite`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderFadeStack = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Fade stack</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 14,
              borderRadius: 8,
              background: preset.color,
              opacity: 0.7,
              animation: `ds-fade-stack ${duration.normal || "200ms"} ease-in-out ${i * 120}ms infinite`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderPulseBar = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Pulse bar</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            height: 12,
            borderRadius: 10,
            background: preset.color,
            transformOrigin: "0% 50%",
            animation: `ds-pulse-bar ${duration.slow || "320ms"} ${easing} infinite`
          }}
        />
        <div
          style={{
            height: 10,
            width: "70%",
            borderRadius: 10,
            background: `${preset.color}cc`,
            transformOrigin: "0% 50%",
            animation: `ds-pulse-bar ${duration.normal || "200ms"} ${easing} infinite alternate`
          }}
        />
      </div>
    </div>
  );

  const renderSlideUp = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Slide-up tiles</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 36,
              borderRadius: 10,
              background: `${preset.color}dd`,
              animation: `ds-slide-up ${duration.normal || "200ms"} ${easing} ${i * 90}ms infinite alternate`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderOrbitDots = () => (
    <div style={loadingTile}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Orbit dots</span>
      </div>
      <div style={{ position: "relative", width: 54, height: 54, margin: "4px auto" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: preset.color,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: `ds-orbit ${dotDuration} linear infinite`,
              animationDelay: `${i * 120}ms`
            }}
          />
        ))}
      </div>
    </div>
  );

  switch (preset.kind) {
    case "progress":
      return renderProgress();
    case "dots":
      return renderDots();
    case "shimmer":
      return renderShimmer();
    case "fade-stack":
      return renderFadeStack();
    case "pulse-bar":
      return renderPulseBar();
    case "slide-up":
      return renderSlideUp();
    case "orbit-dots":
      return renderOrbitDots();
    default:
      return renderSkeleton();
  }
};

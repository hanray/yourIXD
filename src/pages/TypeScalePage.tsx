import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useDesignSystem } from "@state/store";
import { Field } from "@components/forms/Field";
import { Surface } from "@components/common/Surface";

const baseRoleOrder: Array<"display" | "heading" | "subheading" | "body" | "caption" | "label"> = [
  "display",
  "heading",
  "subheading",
  "body",
  "caption",
  "label"
];

type Intent = "expressive" | "functional";
type TypeLevel = {
  id: string;
  label: string;
  size: string;
  lineHeight: string;
  weight: string;
  letterSpacing: string;
  usage: string;
  intent: Intent;
  text: string;
  textTransform?: CSSProperties["textTransform"];
};

const typeScale: Array<{ group: string; intent: Intent; levels: TypeLevel[] }> = [
  {
    group: "Display",
    intent: "expressive",
    levels: [
      { id: "display-xl", label: "Display / XL", size: "font.size.6", lineHeight: "lineHeight.relaxed", weight: "weight.semibold", letterSpacing: "-0.02em", usage: "Hero, campaign, marquee", intent: "expressive", text: "A bold promise that invites people in." },
      { id: "display-l", label: "Display / L", size: "font.size.5", lineHeight: "lineHeight.relaxed", weight: "weight.semibold", letterSpacing: "-0.015em", usage: "Splash, marketing", intent: "expressive", text: "Announce the story with warmth and clarity." },
      { id: "display-m", label: "Display / M", size: "font.size.5", lineHeight: "lineHeight.normal", weight: "weight.semibold", letterSpacing: "-0.01em", usage: "Hero supporting", intent: "expressive", text: "Set context without stealing the spotlight." },
      { id: "display-s", label: "Display / S", size: "font.size.4", lineHeight: "lineHeight.normal", weight: "weight.semibold", letterSpacing: "-0.005em", usage: "Expressive pull quote", intent: "expressive", text: "Carry emotion while staying compact." }
    ]
  },
  {
    group: "Headline",
    intent: "functional",
    levels: [
      { id: "headline-xl", label: "Headline / XL", size: "font.size.5", lineHeight: "lineHeight.normal", weight: "weight.bold", letterSpacing: "-0.01em", usage: "Top-level page heading", intent: "functional", text: "Frame the main decision in one line." },
      { id: "headline-l", label: "Headline / L", size: "font.size.4", lineHeight: "lineHeight.normal", weight: "weight.semibold", letterSpacing: "-0.005em", usage: "Section heading", intent: "functional", text: "Guide the reader to the next topic." },
      { id: "headline-m", label: "Headline / M", size: "font.size.3", lineHeight: "lineHeight.normal", weight: "weight.semibold", letterSpacing: "0em", usage: "Sub-section heading", intent: "functional", text: "Clarify what follows in a compact way." },
      { id: "headline-s", label: "Headline / S", size: "font.size.3", lineHeight: "lineHeight.tight", weight: "weight.semibold", letterSpacing: "0em", usage: "Dense UI heading", intent: "functional", text: "Label a tight section without noise." },
      { id: "title-l", label: "Title / L", size: "font.size.3", lineHeight: "lineHeight.normal", weight: "weight.medium", letterSpacing: "0em", usage: "List title", intent: "functional", text: "Provide context for grouped content." },
      { id: "title-m", label: "Title / M", size: "font.size.2", lineHeight: "lineHeight.normal", weight: "weight.medium", letterSpacing: "0em", usage: "Secondary title", intent: "functional", text: "Support the primary heading succinctly." },
      { id: "title-s", label: "Title / S", size: "font.size.2", lineHeight: "lineHeight.tight", weight: "weight.medium", letterSpacing: "0em", usage: "Compact surfaces", intent: "functional", text: "Stay legible in dense layouts." }
    ]
  },
  {
    group: "Body",
    intent: "functional",
    levels: [
      { id: "body-l", label: "Body / L", size: "font.size.3", lineHeight: "lineHeight.relaxed", weight: "weight.regular", letterSpacing: "0em", usage: "Long-form readability", intent: "functional", text: "Write with breathing room for thoughtful reading." },
      { id: "body-m", label: "Body / M", size: "font.size.2", lineHeight: "lineHeight.normal", weight: "weight.regular", letterSpacing: "0em", usage: "Default body", intent: "functional", text: "Explain the idea in a steady, readable voice." },
      { id: "body-s", label: "Body / S", size: "font.size.1", lineHeight: "lineHeight.normal", weight: "weight.regular", letterSpacing: "0em", usage: "Compact body", intent: "functional", text: "Convey details when space is at a premium." }
    ]
  },
  {
    group: "Label",
    intent: "functional",
    levels: [
      { id: "label-l", label: "Label / L", size: "font.size.2", lineHeight: "lineHeight.tight", weight: "weight.medium", letterSpacing: "0.01em", usage: "Field labels", intent: "functional", text: "Label primary controls with confidence." },
      { id: "label-s", label: "Label / S", size: "font.size.1", lineHeight: "lineHeight.tight", weight: "weight.medium", letterSpacing: "0.01em", usage: "UI labels", intent: "functional", text: "Name dense UI elements without clutter." },
      { id: "caption", label: "Caption", size: "font.size.1", lineHeight: "lineHeight.tight", weight: "weight.regular", letterSpacing: "0.01em", usage: "Helper text", intent: "functional", text: "Offer gentle guidance right beside the control." },
      { id: "footnote", label: "Footnote", size: "font.size.1", lineHeight: "lineHeight.tight", weight: "weight.medium", letterSpacing: "0.02em", usage: "Metadata, status", intent: "functional", text: "Note statuses, timestamps, or subtle context." },
      { id: "overline", label: "Overline", size: "font.size.1", lineHeight: "lineHeight.tight", weight: "weight.medium", letterSpacing: "0.12em", usage: "Eyebrow / kicker", intent: "functional", text: "Signal category quietly.", textTransform: "uppercase" }
    ]
  }
];

const sansPresets = ["SF Pro Text", "Inter", "Neue Haas Grotesk", "Helvetica Neue", "Segoe UI"];

const serifPresets = ["SF Serif", "Georgia", "Times New Roman", "Literata", "Merriweather"];

const monoPresets = ["SFMono-Regular", "JetBrains Mono", "IBM Plex Mono", "Consolas", "Menlo"];

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

const roleLabel = (r: string) => r[0].toUpperCase() + r.slice(1);

const rhythmLevels = [
  { label: "H1", levelId: "headline-xl", text: "Header Style" },
  { label: "H2", levelId: "headline-l", text: "Header Style" },
  { label: "H3", levelId: "headline-m", text: "Header Style" },
  { label: "H4", levelId: "headline-s", text: "Header Style" },
  { label: "H5", levelId: "title-l", text: "Header Style" },
  { label: "H6", levelId: "title-m", text: "Header Style" },
  { label: "Body", levelId: "body-m", text: "Body text" }
];

const px = (value: string) => Number.parseFloat(value.replace("px", "")) || 0;
const toPx = (n: number) => `${Math.max(0, Math.round(n))}px`;

const ratioPresets = [
  { id: "compact", label: "Compact (1.125)", ratio: 1.125 },
  { id: "balanced", label: "Balanced (1.2)", ratio: 1.2 },
  { id: "editorial", label: "Editorial (1.25)", ratio: 1.25 },
  { id: "dramatic", label: "Dramatic (1.333)", ratio: 1.333 }
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const numericSort = (a: string, b: string) => Number(a) - Number(b);

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
  const textRoleKeys = useMemo(() => {
    const keys = Object.keys(globals.textRole || {});
    const ordered = [...baseRoleOrder, ...keys.filter((k) => !baseRoleOrder.includes(k as any))];
    return Array.from(new Set(ordered));
  }, [globals.textRole]);

  const [focusRole, setFocusRole] = useState<string>(textRoleKeys[0] || "heading");
  const [focusId, setFocusId] = useState<string>(typeScale[0].levels[0].id);
  const [webFontFamily, setWebFontFamily] = useState(globals.font.web?.family ?? globals.font.family.sans);
  const [webFontSource, setWebFontSource] = useState(globals.font.web?.source ?? "");
  const [webFontKind, setWebFontKind] = useState<"url" | "google">(globals.font.web?.kind ?? "url");
  const [basicFont, setBasicFont] = useState(globals.font.family.sans);
  const [newRoleName, setNewRoleName] = useState("");
  const [scaleMin, setScaleMin] = useState<number>(14);
  const [scaleMax, setScaleMax] = useState<number>(28);
  const [scalePreset, setScalePreset] = useState<typeof ratioPresets[number]["id"]>("balanced");
  const [scaleSteps, setScaleSteps] = useState<number>(6);
  const [scaleWarning, setScaleWarning] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, left: 0 });
  const [leftWidth, setLeftWidth] = useState<number | undefined>(undefined);

  const roleFocusDefaults: Record<string, string> = {
    display: "display-xl",
    heading: "headline-l",
    subheading: "headline-m",
    body: "body-m",
    caption: "caption",
    label: "label-s"
  };

  useEffect(() => {
    if (!textRoleKeys.includes(focusRole) && textRoleKeys.length > 0) {
      setFocusRole(textRoleKeys[0]);
    }
  }, [textRoleKeys, focusRole]);

  useEffect(() => {
    const currentSans = globals.font.family.sans;
    setWebFontFamily(globals.font.web?.family ?? currentSans);
    setWebFontSource(globals.font.web?.source ?? "");
    setWebFontKind(globals.font.web?.kind ?? "url");
    setBasicFont(currentSans);
  }, [globals.font.web, globals.font.family.sans]);

  useEffect(() => {
    const keys = Object.keys(globals.font.size).sort(numericSort);
    const values = keys.map((k) => px(globals.font.size[k]));
    if (values.length === 0) return;
    const minVal = clamp(values[0], 10, 18);
      const maxVal = clamp(values[values.length - 1], 24, 160);
    setScaleMin(minVal);
    setScaleMax(maxVal);
    setScaleSteps(Math.max(3, Math.min(14, values.length)));

    if (values.length > 1 && values[0] > 0) {
      const estimated = Math.pow(values[values.length - 1] / values[0], 1 / (values.length - 1));
      const closest = ratioPresets.reduce((best, preset) => {
        const diff = Math.abs(preset.ratio - estimated);
        return diff < best.diff ? { id: preset.id, diff } : best;
      }, { id: "balanced" as typeof ratioPresets[number]["id"], diff: Infinity });
      setScalePreset(closest.id);
    } else {
      setScalePreset("balanced");
    }
  }, [globals.font.size]);

  useEffect(() => {
    const web = globals.font.web;
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
  }, [globals.font.web]);

  const sizeKeys = useMemo(() => Object.keys(globals.font.size) as Array<keyof typeof globals.font.size>, [globals.font.size]);
  const sortedSizeKeys = useMemo(() => [...sizeKeys].sort((a, b) => numericSort(String(a), String(b))), [sizeKeys]);
  const lineHeightKeys = useMemo(() => Object.keys(globals.lineHeight) as Array<keyof typeof globals.lineHeight>, [globals.lineHeight]);
  const weightKeys = useMemo(() => Object.keys(globals.weight) as Array<keyof typeof globals.weight>, [globals.weight]);

  const resolveValue = (ref: string) => resolvePath(globals, ref) as string;

  const selectedLevel = useMemo(() => typeScale.flatMap((s) => s.levels).find((l) => l.id === focusId) ?? typeScale[0].levels[0], [focusId]);
  const selectedGroup = useMemo(() => typeScale.find((s) => s.levels.some((l) => l.id === focusId))?.group ?? "", [focusId]);

    const familyForLevel = (level: TypeLevel) => {
      if (level.intent === "expressive") return globals.font.family.serif;
      if (level.id.startsWith("body")) return globals.font.family.serif;
      return globals.font.family.sans;
    };

  const specimenStyle = (level: TypeLevel): CSSProperties => {
    const weightVal = resolveValue(level.weight);
    return {
        fontFamily: familyForLevel(level),
      fontSize: resolveValue(level.size),
      fontWeight: Number(weightVal) || weightVal,
      lineHeight: resolveValue(level.lineHeight),
      letterSpacing: resolveValue(level.letterSpacing) || "0",
      textTransform: level.textTransform,
      margin: 0
    };
  };

  const updateSize = (key: string, raw: number) => update(`font.size.${key}`, toPx(raw));
  const updateLineHeight = (key: string, raw: number) => update(`lineHeight.${key}`, toPx(raw));
  const updateWeight = (key: string, raw: number) => update(`weight.${key}`, `${Math.max(100, Math.min(900, Math.round(raw)))}`);

  const selectedPreset = ratioPresets.find((p) => p.id === scalePreset) ?? ratioPresets[1];

  const generatedSizes = useMemo(() => {
    const steps = Math.max(3, Math.min(20, Math.floor(scaleSteps || 0) || 0));
    const ratio = selectedPreset.ratio;
    const values: number[] = [];
    for (let i = 0; i < steps; i += 1) {
      const raw = scaleMin * Math.pow(ratio, i);
      const rounded = Math.max(Math.round(raw), i === 0 ? scaleMin : values[i - 1] + 1);
      values.push(rounded);
    }
    if (values.length > 1) {
      values[values.length - 1] = clamp(Math.round(scaleMax), values[values.length - 2] + 1, scaleMax);
    }
    return values;
  }, [scaleMin, scaleMax, scaleSteps, selectedPreset]);

  const previewString = generatedSizes.map((v) => v.toString()).join(" · ");

  useEffect(() => {
    let warning = "";
    if (scaleMin >= scaleMax) {
      warning = "Minimum must be less than maximum.";
    } else if (scaleMin < 10 || scaleMin > 18) {
      warning = "Min should stay between 10–18px.";
    } else if (scaleMax < 24 || scaleMax > 160) {
      warning = "Max should stay between 24–160px.";
    }

    const tail = generatedSizes[generatedSizes.length - 1];
    if (!warning && Math.abs(tail - scaleMax) > 2) {
      const closest = ratioPresets.reduce((best, preset) => {
        const diff = Math.abs(preset.ratio - selectedPreset.ratio);
        return diff < best.diff ? { label: preset.label.split(" ")[0], diff } : best;
      }, { label: selectedPreset.label.split(" ")[0], diff: Infinity });
      warning = `Scale end is off by ${Math.abs(tail - scaleMax)}px. Try ${closest.label}.`;
    }

    setScaleWarning(warning);
  }, [scaleMin, scaleMax, generatedSizes, selectedPreset]);

  const applyGeneratedScale = () => {
    if (scaleWarning) return;
    const steps = generatedSizes.length;
    const keys = Array.from({ length: steps }, (_, i) => String(i + 1));

    keys.forEach((key, idx) => {
      update(`font.size.${key}`, toPx(generatedSizes[idx]));
    });

    sortedSizeKeys
      .filter((k) => !keys.includes(String(k)))
      .forEach((k) => update(`font.size.${k}`, undefined));

    Object.entries(globals.textRole).forEach(([role, config]) => {
      const match = /font\.size\.(\d+)/.exec(config.size);
      if (!match) return;
      const idx = Number(match[1]);
      const bounded = clamp(idx, 1, steps);
      if (bounded !== idx) {
        update(`textRole.${role}.size`, `font.size.${bounded}`);
      }
    });
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

  const optionsWithCurrent = (presets: string[], current: string) =>
    presets.includes(current) ? presets : [current, ...presets];

  const onDragMove = (clientX: number) => {
    if (!layoutRef.current) return;
    const rect = layoutRef.current.getBoundingClientRect();
    const minLeft = 320;
    const minRight = 340;
    const maxLeft = rect.width - minRight;
    const delta = clientX - dragStart.current.x;
    const next = Math.max(minLeft, Math.min(dragStart.current.left + delta, maxLeft));
    setLeftWidth(next);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onDragMove(e.clientX);
    };
    const handleUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const gridTemplateColumns = leftWidth
    ? `${leftWidth}px 10px minmax(320px, 1fr)`
    : page.gridTemplateColumns;

  return (
    <div ref={layoutRef} style={{ ...page, gridTemplateColumns }}>
      <div style={right}>
        <div style={previewHeader}>
          <div>
            <div style={sectionTitle}>Type specimens</div>
            <div style={muted}>Default and inverse contexts. Click a role to focus.</div>
          </div>
        </div>
        <div style={divider} />
        <div style={rhythmBlock}>
          <div style={rhythmTitle}>Typographic rhythm</div>
          <div style={rhythmNote}>Visually express typographic rhythm using a modular scale. Headings step down with a consistent cadence.</div>
          <div style={rhythmGrid}>
            {rhythmLevels.map((item) => {
              const level = typeScale.flatMap((s) => s.levels).find((l) => l.id === item.levelId);
              if (!level) return null;
              return (
                <div key={item.label} style={rhythmRow}>
                  <div style={rhythmSize}>{resolveValue(level.size)}</div>
                  <div style={{ ...specimenStyle(level), lineHeight: "1.1", display: "flex", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{item.label}</span>
                    <span>{item.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={divider} />
        <div style={inspectorInline}>
          <div style={sectionTitle}>Inspector</div>
          <div style={inspectorGridInline}>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>role</div>
              <div style={metaValue}>{selectedGroup || selectedLevel.label}</div>
            </div>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>usage</div>
              <div style={metaValue}>{selectedLevel.usage}</div>
            </div>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>font-size</div>
              <div style={metaToken}>{selectedLevel.size}</div>
              <div style={metaValue}>{resolveValue(selectedLevel.size)}</div>
            </div>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>line-height</div>
              <div style={metaToken}>{selectedLevel.lineHeight}</div>
              <div style={metaValue}>{resolveValue(selectedLevel.lineHeight)}</div>
            </div>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>font-weight</div>
              <div style={metaToken}>{selectedLevel.weight}</div>
              <div style={metaValue}>{String(resolveValue(selectedLevel.weight))}</div>
            </div>
            <div style={inspectorItemInline}>
              <div style={metaLabel}>letter-spacing</div>
              <div style={metaToken}>{selectedLevel.letterSpacing}</div>
              <div style={metaValue}>{resolveValue(selectedLevel.letterSpacing) || "0"}</div>
            </div>
          </div>
        </div>
        <div style={divider} />
        <div style={specimenGrid}>
          <Surface polarity="default" style={specimenSurface(globals.color.surface.elevated, globals.color.text.primary)}>
            <SpecimenContent globals={globals} focusId={focusId} setFocusId={setFocusId} specimenStyle={specimenStyle} resolveValue={resolveValue} />
          </Surface>
          <Surface polarity="inverse" style={specimenSurface(globals.color.surface.inverse, globals.color.text.inverse)}>
            <SpecimenContent globals={globals} focusId={focusId} setFocusId={setFocusId} specimenStyle={specimenStyle} resolveValue={resolveValue} inverse />
          </Surface>
        </div>
      </div>

      <div
        style={dragHandle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        onMouseDown={(e) => {
          if (!layoutRef.current) return;
          const first = layoutRef.current.children[0] as HTMLElement | undefined;
          const currentWidth = first ? first.getBoundingClientRect().width : 0;
          dragStart.current = { x: e.clientX, left: currentWidth };
          isDragging.current = true;
          e.preventDefault();
        }}
      >
        <div style={dragGrip} aria-hidden />
      </div>

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

        <details style={accordion}>
          <summary style={accordionSummary}>
            <div style={accordionTitle}>Font settings</div>
            <div style={accordionHint}>Web font loader, core sizes, weights, and text roles</div>
          </summary>
          <div style={accordionBody}>
            <div style={section}>
              <div style={sectionTitle}>Web font loader</div>
              <div style={{ display: "grid", gap: 10 }}>
                <Field
                  label="Basic font (no URL)"
                  input={(
                    <select
                      style={select}
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
                <Field label="Font family name" input={<input style={input} value={webFontFamily} onChange={(e) => setWebFontFamily(e.target.value)} />} />
                <Field
                  label="Source (URL or Google import)"
                  input={<input style={input} value={webFontSource} onChange={(e) => setWebFontSource(e.target.value)} placeholder="https://...woff2 or https://fonts.googleapis.com/..." />}
                />
                <div style={radioRow}>
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
            </div>

            <div style={section}>
              <div style={sectionTitle}>Type Scale Generator</div>
              <div style={generatorGrid}>
                <div style={generatorItem}>
                  <div style={mini}>Minimum size (px)</div>
                  <input
                    type="number"
                    min={10}
                    max={18}
                    style={input}
                    value={scaleMin}
                    onChange={(e) => setScaleMin(clamp(Number(e.target.value), 8, 24))}
                  />
                </div>
                <div style={generatorItem}>
                  <div style={mini}>Maximum size (px)</div>
                  <input
                    type="number"
                    min={24}
                    max={160}
                    style={input}
                    value={scaleMax}
                    onChange={(e) => {
                      const raw = Number(e.target.value) || 0;
                      setScaleMax(raw > 160 ? 200 : raw);
                    }}
                  />
                </div>
                <div style={generatorItem}>
                  <div style={mini}>Scale character</div>
                  <select style={select} value={scalePreset} onChange={(e) => setScalePreset(e.target.value as typeof scalePreset)}>
                    {ratioPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                </div>
                <div style={generatorItem}>
                  <div style={mini}>Steps</div>
                  <input
                    type="number"
                    min={3}
                    max={14}
                    style={input}
                    value={scaleSteps}
                    onChange={(e) => setScaleSteps(clamp(Number(e.target.value), 3, 14))}
                  />
                </div>
              </div>

              <div style={previewRow}>
                <div style={mini}>Preview</div>
                <div style={previewText}>{previewString}</div>
              </div>

              {scaleWarning && <div style={warningBox}>{scaleWarning}</div>}

              <div style={generatorActions}>
                <button style={{ ...buttonPrimary, opacity: scaleWarning ? 0.6 : 1 }} disabled={!!scaleWarning} onClick={applyGeneratedScale}>
                  Generate scale
                </button>
                <div style={muted}>{`Uses ${selectedPreset.label}`}</div>
              </div>

              <details open={advancedOpen} onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)} style={advancedDetails}>
                <summary style={advancedSummary}>Advanced: show generated tokens</summary>
                <div style={listGrid}>
                  {generatedSizes.map((size, idx) => (
                    <div key={idx} style={row}>
                      <div style={mini}>{`font.size.${idx + 1}`}</div>
                      <input type="number" style={input} value={size} readOnly />
                      <span style={suffix}>px</span>
                    </div>
                  ))}
                </div>
              </details>
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
                {textRoleKeys.map((role) => {
                  const config = globals.textRole[role];
                  if (!config) return null;
                  return (
                    <div key={role} style={roleRow}>
                      <button
                        style={{ ...pill, ...(focusRole === role ? pillActive : {}) }}
                        onClick={() => {
                          setFocusRole(role);
                          const target = roleFocusDefaults[role] || typeScale[0].levels[0].id;
                          setFocusId(target);
                        }}
                      >
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

                <div style={newRoleRow}>
                  <input
                    style={input}
                    placeholder="New role name (e.g., 'hero')"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <button
                    style={buttonPrimary}
                    onClick={() => {
                      const roleKey = newRoleName.trim();
                      if (roleKey && !globals.textRole[roleKey]) {
                        update(`textRole.${roleKey}.size`, "font.size.2");
                        update(`textRole.${roleKey}.weight`, "weight.regular");
                        update(`textRole.${roleKey}.lineHeight`, "lineHeight.normal");
                        setNewRoleName("");
                      }
                    }}
                    disabled={!newRoleName.trim() || !!globals.textRole[newRoleName.trim()]}
                  >
                    Add Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

const SpecimenContent = ({ globals, focusId, setFocusId, specimenStyle, inverse = false }: {
  globals: any;
  focusId: string;
  setFocusId: (id: string) => void;
  specimenStyle: (level: TypeLevel) => CSSProperties;
  inverse?: boolean;
}) => {
  const text = globals.color.text;
  const body = inverse ? text.inverse : text.primary;

  const expressiveSpacing = 18;
  const functionalSpacing = 8;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {typeScale.map((section) => {
        const levels = section.intent === "expressive" ? section.levels.slice(0, 3) : section.levels;
        return (
          <div key={section.group} style={{ display: "grid", gap: 6 }}>
            <div style={{ ...groupHeader, marginBottom: section.intent === "expressive" ? 6 : 2 }}>
              <span>{section.group}</span>
              <span style={chip}>{section.intent === "expressive" ? "Expressive" : "Functional"}</span>
            </div>
            <div style={{ display: "grid", gap: section.intent === "expressive" ? expressiveSpacing : functionalSpacing }}>
              {levels.map((level) => {
                const isFocus = focusId === level.id;
                return (
                  <div
                    key={level.id}
                    style={{
                      ...lineItem,
                      color: body,
                      opacity: section.intent === "expressive" && !isFocus ? 0.88 : 1,
                      background: isFocus ? (inverse ? "rgba(255,255,255,0.08)" : "rgba(15,98,254,0.06)") : "transparent",
                      outline: isFocus ? (inverse ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(15,98,254,0.35)") : "none"
                    }}
                    onMouseEnter={() => setFocusId(level.id)}
                    onClick={() => setFocusId(level.id)}
                  >
                    <div style={{ ...specimenStyle(level), transition: "transform 140ms ease", transform: isFocus ? "translateY(-1px)" : "none" }}>
                      {level.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const page: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 10px minmax(360px, 0.9fr)",
  gap: 12,
  height: "100%",
  padding: 16,
  alignItems: "start"
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
  gap: 10,
  minHeight: 0,
  alignSelf: "start",
  minWidth: 0
};

const accordion: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface-alt)",
  boxShadow: "var(--shadow-sm)",
  padding: "6px 8px 10px"
};

const accordionSummary: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  padding: "6px 4px",
  listStyle: "none",
  fontWeight: 750
};

const accordionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800
};

const accordionHint: CSSProperties = {
  fontSize: 12,
  fontWeight: 650,
  color: "var(--text-muted)"
};

const accordionBody: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "4px 4px 8px"
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

const newRoleRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center"
};

const buttonPrimary: CSSProperties = {
  background: "#0f62fe",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 750,
  cursor: "pointer",
  boxShadow: "var(--shadow-sm)",
  transition: "transform 120ms ease, box-shadow 120ms ease"
};

const radioRow: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const radioLabel: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontWeight: 650
};

const radioInput: CSSProperties = {
  accentColor: "#0f62fe",
  width: 16,
  height: 16
};

const generatorGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10
};

const generatorItem: CSSProperties = {
  display: "grid",
  gap: 4
};

const previewRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 8,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 10,
  background: "var(--surface-alt)",
  border: "1px solid var(--border)"
};

const previewText: CSSProperties = {
  fontWeight: 700,
  color: "var(--text)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

const warningBox: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #f0b429",
  background: "#fff8e6",
  color: "#8a4b0f",
  fontWeight: 650,
  boxShadow: "inset 0 1px 0 rgba(0,0,0,0.03)"
};

const generatorActions: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap"
};

const advancedDetails: CSSProperties = {
  marginTop: 8,
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "6px 8px",
  background: "var(--surface-alt)"
};

const advancedSummary: CSSProperties = {
  cursor: "pointer",
  fontWeight: 750,
  color: "var(--text)",
  listStyle: "none",
  padding: "4px 2px"
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

const lineItem: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "4px 6px",
  cursor: "pointer",
  transition: "background 140ms ease, outline 140ms ease, transform 140ms ease"
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

const divider: CSSProperties = {
  height: 1,
  background: "var(--border)"
};

const dragHandle: CSSProperties = {
  width: 10,
  cursor: "col-resize",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 2px",
  background: "linear-gradient(180deg, rgba(15,98,254,0.08), rgba(15,98,254,0.02))",
  borderRadius: 12,
  alignSelf: "stretch",
  height: "100%"
};

const dragGrip: CSSProperties = {
  width: 4,
  height: 64,
  borderRadius: 999,
  background: "repeating-linear-gradient(180deg, var(--border-strong) 0, var(--border-strong) 4px, transparent 4px, transparent 8px)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)",
  opacity: 0.9
};

const specimenGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
  minHeight: 0
};

const specimenSurface = (bg: string, fg: string): CSSProperties => ({
  background: bg,
  color: fg,
  borderRadius: 16,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
  minHeight: 320
});

const groupHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
  fontSize: 14
};

const chip: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "3px 8px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  background: "rgba(0,0,0,0.04)"
};

const metaItem: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr) minmax(0, 1fr)",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  minWidth: 0
};

const metaLabel: CSSProperties = {
  fontWeight: 800,
  color: "var(--text)"
};

const metaToken: CSSProperties = {
  fontWeight: 700,
  color: "var(--text-muted)",
  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  minWidth: 0
};

const metaValue: CSSProperties = {
  fontWeight: 600,
  color: "var(--text-muted)",
  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  minWidth: 0
};

const inspectorInline: CSSProperties = {
  display: "grid",
  gap: 8,
  background: "transparent"
};

const inspectorGridInline: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "start"
};

const inspectorItemInline: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "6px 2px"
};

const rhythmRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 12,
  alignItems: "baseline"
};

const rhythmSize: CSSProperties = {
  fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
  fontSize: 13,
  color: "var(--text-muted)"
};

const rhythmBlock: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 12,
  background: "transparent",
  borderRadius: 14
};

const rhythmTitle: CSSProperties = {
  fontWeight: 800,
  fontSize: 14
};

const rhythmNote: CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  lineHeight: 1.4
};

const rhythmGrid: CSSProperties = {
  display: "grid",
  gap: 6
};

export default TypeScalePage;

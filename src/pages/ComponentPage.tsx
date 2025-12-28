import { ComponentTokens, DesignSystemSnapshot } from "@models/designSystem";
import { useDesignSystem } from "@state/store";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { defaultSnapshot } from "@data/defaults";

type Props = { componentId: string };

type Option = { label: string; value: string };

const flattenTokenOptions = (obj: Record<string, any>, prefix: string[] = []): Option[] => {
  const items: Option[] = [];
  Object.entries(obj).forEach(([key, value]) => {
    const path = [...prefix, key];
    if (typeof value === "string" || typeof value === "number") {
      items.push({ label: path.join("."), value: path.join(".") });
    } else if (value && typeof value === "object") {
      items.push(...flattenTokenOptions(value, path));
    }
  });
  return items;
};

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
  const resolvedBorderColor = resolvePath(snapshot, tokens.color?.border);
  const paddingX = resolvePath(snapshot, tokens.spacing?.paddingX);
  const paddingY = resolvePath(snapshot, tokens.spacing?.paddingY);
  const radius = resolvePath(snapshot, tokens.radius);
  const shadow = resolvePath(snapshot, tokens.shadow);
  const resolvedBorderWidth = resolvePath(snapshot, tokens.border?.width) ?? tokens.border?.width;
  const resolvedBorderStyle = tokens.border?.style ?? (resolvedBorderColor ? "solid" : undefined);
  const typography = tokens.typography ?? {};

  const hasValue = (val: any) => val !== undefined && val !== null && !(typeof val === "string" && val.trim() === "");

  const style: CSSProperties = {
    color: fg,
    backgroundColor: bg,
    boxShadow: shadow,
    borderRadius: radius,
    padding: hasValue(paddingX) && hasValue(paddingY) ? `${paddingY} ${paddingX}` : undefined,
    borderColor: resolvedBorderColor,
    borderWidth: resolvedBorderColor ? resolvedBorderWidth ?? "1px" : undefined,
    borderStyle: resolvedBorderColor ? resolvedBorderStyle ?? "solid" : undefined,
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

// Safely merge shallow objects, skipping undefined/null sources.
const mergePart = (...parts: Array<Record<string, any> | undefined>) =>
  parts.reduce<Record<string, any>>((acc, part) => (part ? { ...acc, ...part } : acc), {});

type TokenControlProps = {
  label: string;
  value?: string;
  onChange: (next: string) => void;
  options?: Option[];
  resolveValue?: (val?: string) => string;
  placeholder?: string;
  kind?: "text" | "number";
  defaultValue?: string;
  step?: number;
  forceTokenOnly?: boolean;
  allowLiteral?: boolean;
  numberUnit?: "px";
};

const TokenControl = ({
  label,
  value,
  onChange,
  options,
  resolveValue,
  placeholder,
  kind = "text",
  defaultValue,
  step = 1,
  forceTokenOnly = false,
  allowLiteral = true,
  numberUnit
}: TokenControlProps) => {
  const [localValue, setLocalValue] = useState<string>(value ?? "");
  const resolved = resolveValue ? resolveValue(value) : value;

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const handleChange = (next: string) => {
    let normalized = next;
    if (kind === "number" && !forceTokenOnly) {
      const n = Number.parseFloat(next.replace("px", ""));
      if (!Number.isNaN(n)) {
        const unit = numberUnit ?? "px";
        normalized = `${n}${unit}`;
      }
    }
    setLocalValue(normalized);
    onChange(normalized);
  };

  const useSelect = options && options.length > 0;
  const canUseInput = allowLiteral && !forceTokenOnly && !useSelect;

  return (
    <label style={tokenRow} title={resolved ? `Resolves to ${resolved}` : undefined}>
      <div style={tokenHeader}>
        <span style={{ fontWeight: 650 }}>{label}</span>
      </div>

      {useSelect ? (
        <div style={{ display: "grid", gap: 6 }}>
          <select
            style={selectStyle}
            value={localValue === "" ? "__placeholder" : localValue}
            onChange={(e) => handleChange(e.target.value === "__placeholder" ? "" : e.target.value)}
          >
            <option value="__placeholder" disabled>
              {placeholder ?? "Choose a token"}
            </option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={helperText}>Expected tokens like: {options?.slice(0, 3).map((o) => o.value).join(", ")}{(options?.length ?? 0) > 3 ? " …" : ""}</div>
        </div>
      ) : canUseInput ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={inputStyle}
            value={(() => {
              if (kind !== "number") return localValue ?? "";
              const parsed = Number.parseFloat(localValue.replace("px", ""));
              return Number.isNaN(parsed) ? "" : parsed;
            })()}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder ?? "e.g. 12"}
            type={kind === "number" ? "number" : "text"}
            step={step}
          />
          {numberUnit === "px" && <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>px</span>}
          {defaultValue && (
            <button type="button" style={resetLink} onClick={() => handleChange(defaultValue)}>
              Reset
            </button>
          )}
        </div>
      ) : (
        <div style={helperText}>No tokens available · Expected something like {placeholder ?? "a token path (e.g. color.text.primary)"}</div>
      )}
    </label>
  );
};

export const ComponentPage = ({ componentId }: Props) => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const update = useDesignSystem((s) => s.updateComponentTokens);
  const reset = useDesignSystem((s) => s.resetComponentTokens);
  const spec = snapshot.components[componentId];
  const defaultSpec = useMemo(() => defaultSnapshot().components[componentId], [componentId]);
  const [flashKey, setFlashKey] = useState(0);
  const [selectedState, setSelectedState] = useState<string>("default");
  const [compareDefault, setCompareDefault] = useState<boolean>(false);

  useEffect(() => {
    setFlashKey((k) => k + 1);
    return undefined;
  }, [snapshot.updatedAt]);

  const toConcrete = (val?: string) => {
    if (!val) return "";
    const resolved = resolvePath(snapshot, val);
    return resolved ?? val;
  };

  const renderStateBlock = (stateKey: string) => {
    const tokens = spec.states?.[stateKey] ?? {};
    const pushUpdate = (patch: ComponentTokens) => {
      if (stateKey === "default") {
        update(componentId, "base", componentId, patch);
      } else {
        update(componentId, "state", stateKey, patch);
      }
    };
    return (
      <div key={stateKey} style={stateControlCard}>
        <div style={subSectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>State · {stateKey}</span>
          </div>
          {stateKey !== "default" && (
            <button style={ghostButton} onClick={() => setSelectedState(stateKey)}>
              Focus preview
            </button>
          )}
        </div>
        <div style={miniGrid}>
          <TokenControl
            label="Foreground"
            value={tokens.color?.fg}
            onChange={(v) => pushUpdate({ color: mergePart(tokens.color, { fg: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.text.primary"
            defaultValue={getDefaultValue(`states.${stateKey}.color.fg`)}
          />
          <TokenControl
            label="Background"
            value={tokens.color?.bg}
            onChange={(v) => pushUpdate({ color: mergePart(tokens.color, { bg: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.surface.elevated"
            defaultValue={getDefaultValue(`states.${stateKey}.color.bg`)}
          />
          <TokenControl
            label="Border"
            value={tokens.color?.border}
            onChange={(v) => pushUpdate({ color: mergePart(tokens.color, { border: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.border.default"
            defaultValue={getDefaultValue(`states.${stateKey}.color.border`)}
          />
          <TokenControl
            label="Shadow"
            value={tokens.shadow}
            onChange={(v) => pushUpdate({ shadow: v })}
            options={shadowOptions}
            resolveValue={toConcrete}
            placeholder="shadow.sm"
            defaultValue={getDefaultValue(`states.${stateKey}.shadow`)}
            forceTokenOnly
          />
        </div>
      </div>
    );
  };

  const colorOptions = useMemo(() => flattenTokenOptions(snapshot.globals.color, ["color"]), [snapshot.globals.color]);
  const spaceOptions = useMemo(() => flattenTokenOptions(snapshot.globals.space), [snapshot.globals.space]);
  const radiusOptions = useMemo(() => flattenTokenOptions(snapshot.globals.radius), [snapshot.globals.radius]);
  const shadowOptions = useMemo(() => flattenTokenOptions(snapshot.globals.shadow), [snapshot.globals.shadow]);
  const fontSizeOptions = useMemo(() => flattenTokenOptions(snapshot.globals.font.size), [snapshot.globals.font.size]);
  const lineHeightOptions = useMemo(() => flattenTokenOptions(snapshot.globals.lineHeight), [snapshot.globals.lineHeight]);
  const weightOptions = useMemo(() => flattenTokenOptions(snapshot.globals.weight), [snapshot.globals.weight]);
  const fontFamilyOptions = useMemo(
    () => [
      { label: snapshot.globals.font.family.sans, value: snapshot.globals.font.family.sans },
      { label: snapshot.globals.font.family.serif, value: snapshot.globals.font.family.serif },
      { label: snapshot.globals.font.family.mono, value: snapshot.globals.font.family.mono },
      ...(snapshot.globals.font.web
        ? [{ label: snapshot.globals.font.web.family, value: snapshot.globals.font.web.family }]
        : [])
    ],
    [snapshot.globals.font.family, snapshot.globals.font.web]
  );

  const requiredStates = spec?.contract?.requiredStates ?? ["default"];
  const coreStates = ["default", "hover"].filter((s) => requiredStates.includes(s));
  const secondaryStates = requiredStates.filter((s) => !coreStates.includes(s));

  const currentStateTokens = selectedState === "default" ? spec.baseTokens : spec.states?.[selectedState] ?? {};

  const updateSelected = (patch: ComponentTokens) => {
    if (selectedState === "default") {
      update(componentId, "base", componentId, patch);
    } else {
      update(componentId, "state", selectedState, patch);
    }
  };

  const getDefaultValue = (path: string): string => {
    if (!defaultSpec) return "";
    const parts = path.split(".");
    let node: any = defaultSpec as any;
    for (const part of parts) {
      if (node && typeof node === "object" && part in node) {
        node = node[part];
      } else {
        return "";
      }
    }
    return typeof node === "string" ? node : "";
  };

  if (!spec) return <div style={{ padding: 24 }}>Component not found</div>;

  const renderBaseGroup = () => (
    <details open style={controlSection}>
      <summary style={summaryRow}>
        <div>
          <div style={sectionTitle}>Base intent</div>
          <div style={muted}>Edits apply to the currently selected state: {selectedState}.</div>
        </div>
      </summary>
      <div style={controlGrid}> 
        <div style={controlColumn}>
          <div style={miniLabel}>Layout</div>
          <TokenControl
            label="Padding X"
            value={currentStateTokens.spacing?.paddingX ?? spec.baseTokens.spacing?.paddingX}
            onChange={(v) => updateSelected({ spacing: mergePart(spec.baseTokens.spacing, currentStateTokens.spacing, { paddingX: v }) })}
            options={spaceOptions}
            resolveValue={toConcrete}
            placeholder="space.3"
            kind="number"
            defaultValue={getDefaultValue("baseTokens.spacing.paddingX")}
            forceTokenOnly
          />
          <TokenControl
            label="Padding Y"
            value={currentStateTokens.spacing?.paddingY ?? spec.baseTokens.spacing?.paddingY}
            onChange={(v) => updateSelected({ spacing: mergePart(spec.baseTokens.spacing, currentStateTokens.spacing, { paddingY: v }) })}
            options={spaceOptions}
            resolveValue={toConcrete}
            placeholder="space.2"
            kind="number"
            defaultValue={getDefaultValue("baseTokens.spacing.paddingY")}
            forceTokenOnly
          />
          <TokenControl
            label="Gap"
            value={currentStateTokens.spacing?.gap ?? spec.baseTokens.spacing?.gap}
            onChange={(v) => updateSelected({ spacing: mergePart(spec.baseTokens.spacing, currentStateTokens.spacing, { gap: v }) })}
            options={spaceOptions}
            resolveValue={toConcrete}
            placeholder="space.2"
            kind="number"
            defaultValue={getDefaultValue("baseTokens.spacing.gap")}
            forceTokenOnly
          />
        </div>

        <div style={controlColumn}>
          <div style={miniLabel}>Color</div>
          <TokenControl
            label="Foreground"
            value={currentStateTokens.color?.fg ?? spec.baseTokens.color?.fg}
            onChange={(v) => updateSelected({ color: mergePart(spec.baseTokens.color, currentStateTokens.color, { fg: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.text.primary"
            defaultValue={getDefaultValue("baseTokens.color.fg")}
          />
          <TokenControl
            label="Background"
            value={currentStateTokens.color?.bg ?? spec.baseTokens.color?.bg}
            onChange={(v) => updateSelected({ color: mergePart(spec.baseTokens.color, currentStateTokens.color, { bg: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.surface.elevated"
            defaultValue={getDefaultValue("baseTokens.color.bg")}
          />
          <TokenControl
            label="Border"
            value={currentStateTokens.color?.border ?? spec.baseTokens.color?.border}
            onChange={(v) => updateSelected({ color: mergePart(spec.baseTokens.color, currentStateTokens.color, { border: v }) })}
            options={colorOptions}
            resolveValue={toConcrete}
            placeholder="color.border.default"
            defaultValue={getDefaultValue("baseTokens.color.border")}
          />
        </div>

        <div style={controlColumn}>
          <div style={miniLabel}>Type</div>
          <TokenControl
            label="Font family"
            value={currentStateTokens.typography?.fontFamily ?? spec.baseTokens.typography?.fontFamily ?? fontFamilyOptions[0]?.value}
            onChange={(v) => updateSelected({ typography: mergePart(spec.baseTokens.typography, currentStateTokens.typography, { fontFamily: v }) })}
            options={fontFamilyOptions}
            resolveValue={toConcrete}
            placeholder="Font family"
            defaultValue={getDefaultValue("baseTokens.typography.fontFamily")}
          />
          <TokenControl
            label="Size"
            value={currentStateTokens.typography?.size ?? spec.baseTokens.typography?.size}
            onChange={(v) => updateSelected({ typography: mergePart(spec.baseTokens.typography, currentStateTokens.typography, { size: v }) })}
            options={fontSizeOptions}
            resolveValue={toConcrete}
            placeholder="font.size.2"
            defaultValue={getDefaultValue("baseTokens.typography.size")}
            forceTokenOnly
          />
          <TokenControl
            label="Line height"
            value={currentStateTokens.typography?.lineHeight ?? spec.baseTokens.typography?.lineHeight}
            onChange={(v) => updateSelected({ typography: mergePart(spec.baseTokens.typography, currentStateTokens.typography, { lineHeight: v }) })}
            options={lineHeightOptions}
            resolveValue={toConcrete}
            placeholder="lineHeight.normal"
            defaultValue={getDefaultValue("baseTokens.typography.lineHeight")}
            forceTokenOnly
          />
          <TokenControl
            label="Weight"
            value={currentStateTokens.typography?.weight ?? spec.baseTokens.typography?.weight}
            onChange={(v) => updateSelected({ typography: mergePart(spec.baseTokens.typography, currentStateTokens.typography, { weight: v }) })}
            options={weightOptions}
            resolveValue={toConcrete}
            placeholder="weight.regular"
            defaultValue={getDefaultValue("baseTokens.typography.weight")}
            forceTokenOnly
          />
        </div>

        <div style={controlColumn}>
          <div style={miniLabel}>Shape</div>
          <TokenControl
            label="Radius"
            value={currentStateTokens.radius ?? spec.baseTokens.radius}
            onChange={(v) => updateSelected({ radius: v })}
            options={radiusOptions}
            resolveValue={toConcrete}
            placeholder="radius.md"
            kind="number"
            defaultValue={getDefaultValue("baseTokens.radius")}
            forceTokenOnly
          />
          <TokenControl
            label="Shadow"
            value={currentStateTokens.shadow ?? spec.baseTokens.shadow}
            onChange={(v) => updateSelected({ shadow: v })}
            options={shadowOptions}
            resolveValue={toConcrete}
            placeholder="shadow.sm"
            defaultValue={getDefaultValue("baseTokens.shadow")}
            forceTokenOnly
          />
          <TokenControl
            label="Border width"
            value={currentStateTokens.border?.width ?? spec.baseTokens.border?.width ?? "1px"}
            onChange={(v) => updateSelected({ border: mergePart(spec.baseTokens.border, currentStateTokens.border, { width: v }) })}
            resolveValue={toConcrete}
            placeholder="1"
            kind="number"
            defaultValue={getDefaultValue("baseTokens.border.width")}
            allowLiteral
            numberUnit="px"
          />
          <TokenControl
            label="Border style"
            value={currentStateTokens.border?.style ?? spec.baseTokens.border?.style ?? "solid"}
            onChange={(v) => updateSelected({ border: mergePart(spec.baseTokens.border, currentStateTokens.border, { style: v }) })}
            resolveValue={toConcrete}
            placeholder="solid"
            defaultValue={getDefaultValue("baseTokens.border.style")}
          />
        </div>
      </div>
    </details>
  );

  const renderStateGroup = () => (
    <details open style={controlSection}>
      <summary style={summaryRow}>
        <div>
          <div style={sectionTitle}>State intent</div>
          <div style={muted}>Adjust only when behavior diverges from default.</div>
        </div>
      </summary>
      <div style={{ display: "grid", gap: 12 }}>
        {coreStates.map((stateKey) => renderStateBlock(stateKey))}
        {secondaryStates.length > 0 && (
          <details style={nestedDetails}>
            <summary style={summaryRow}>Advanced states ({secondaryStates.length})</summary>
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {secondaryStates.map((stateKey) => renderStateBlock(stateKey))}
            </div>
          </details>
        )}
      </div>
    </details>
  );

  const baselineStyle = tokensToStyle(snapshot, mergeTokens(spec.baseTokens, spec.states?.default));

  const stateTone = (stateKey: string, style: CSSProperties) => {
    const bg = (style.backgroundColor as string) || "var(--surface-alt)";
    const borderColor = (style.borderColor as string) || "var(--border)";
    const textColor = (style.color as string) || "#0f172a";
    const chipBg = "rgba(0,0,0,0.06)";

    // Disabled gets a muted surface to reflect disabled intent without inventing a new palette
    if (stateKey === "disabled") {
      return {
        cardBg: bg,
        surfaceBg: bg,
        borderColor,
        chip: { background: "rgba(148, 163, 184, 0.25)", color: "#475569" },
        glow: "0 0 0 0 rgba(0,0,0,0)"
      };
    }

    return {
      cardBg: bg,
      surfaceBg: bg,
      borderColor,
      chip: { background: chipBg, color: textColor },
      glow: "var(--shadow-sm)"
    };
  };

  const previewMatrix = () => {
    return (
      <div style={visualSection}>
        <div style={visualHeader}>
          <div>
            <div style={sectionTitle}>Visual states</div>
            <div style={muted}>States in one strip; selected enlarges, others dim.</div>
          </div>
        </div>
        <div style={stateStrip}>
          {requiredStates.map((stateKey) => {
            const stateTokens = spec.states?.[stateKey];
            const merged = mergeTokens(spec.baseTokens, stateTokens);
            const style = tokensToStyle(snapshot, merged);
            const isActive = selectedState === stateKey;
            const showGhost = false;
            const tone = stateTone(stateKey, style);
            const inherits = !stateTokens;

            return (
              <div
                role="button"
                tabIndex={0}
                key={stateKey}
                onClick={() => setSelectedState(stateKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedState(stateKey);
                  }
                }}
                style={{
                  ...statePill,
                  background: tone.cardBg,
                  borderColor: tone.borderColor,
                  opacity: inherits && !isActive ? 0.7 : 1,
                  transform: isActive ? "scale(1.04)" : "scale(0.98)",
                  boxShadow: isActive ? tone.glow : "var(--shadow-sm)",
                  animation: flashKey ? "previewFlash 0.45s ease" : undefined
                }}
              >
                <div style={statePillHeader}>
                  <span style={{ fontWeight: 750 }}>{stateKey}</span>
                </div>
                <div style={{ ...statePreviewSurface, background: tone.surfaceBg, borderColor: tone.borderColor }}>
                  {showGhost && (
                    <div style={ghostLayer}>
                      <PreviewExample componentId={spec.id} style={{ ...baselineStyle, opacity: 0.4 }} snapshot={snapshot} stateKey="default" />
                      <span style={ghostLabel}>Default</span>
                    </div>
                  )}
                  <div style={{ ...previewAnim, transform: isActive ? "scale(1.02)" : "scale(0.98)", transition: "transform 180ms ease, opacity 200ms ease" }}>
                    <PreviewExample componentId={spec.id} style={style} snapshot={snapshot} stateKey={stateKey} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleReset = () => reset(componentId);

  return (
    <div style={pageGrid}>
      <div style={leftRail}>
        <div>
          <div style={{ fontWeight: 800 }}>{spec?.label ?? componentId}</div>
          <div style={muted}>Observe first, edit second.</div>
        </div>
        <div style={{ display: "grid", gap: 6 }} role="radiogroup" aria-label="States">
          {requiredStates.map((state) => {
            const isActive = selectedState === state;
            return (
              <button
                key={state}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-pressed={isActive}
                style={{ ...railItem, ...(isActive ? railItemActive : {}) }}
                onClick={() => setSelectedState(state)}
              >
                <span>{state}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={dangerButton} onClick={handleReset}>Reset</button>
        </div>
      </div>

      <div style={rightColumn}>
        <div style={topRow}>{previewMatrix()}</div>
        <div style={sectionDivider} aria-hidden />
        <div style={bottomRow}>
          <div style={controlsHeader}>
            <div>
              <div style={sectionTitle}>Controls</div>
              <div style={muted}>Secondary. Expand only when visuals need intent changes.</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {renderBaseGroup()}
            {renderStateGroup()}
          </div>
        </div>
      </div>
    </div>
  );
};

type PreviewProps = { componentId: string; style?: CSSProperties; snapshot: DesignSystemSnapshot; stateKey?: string };

const PreviewExample = ({ componentId, style, snapshot, stateKey }: PreviewProps) => {
  switch (componentId) {
    case "button":
      return <button style={{ ...previewButton, ...style }}>Button</button>;
    case "input":
      return <input style={{ ...previewInput, ...style }} placeholder="Type here" />;
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
    case "checkbox":
      return (
        <label style={choiceRow}>
          <span style={checkboxBox(style)} />
          <span style={{ fontWeight: 600 }}>Checkbox label</span>
        </label>
      );
    case "radio": {
      const isDisabled = stateKey === "disabled";
      const isActive = stateKey === "active" || stateKey === "selected" || stateKey === "checked";
      const isHover = stateKey === "hover";
      const isFocus = stateKey === "focus" || stateKey === "focus-visible";

      const accent = snapshot.globals.color.accent.primary.base;
      const ringColor = isDisabled ? style?.borderColor || "var(--border)" : isActive || isHover || isFocus ? accent : style?.borderColor || "var(--border)";
      const focusRing = isFocus ? `${accent}33` : undefined;

      return (
        <label style={{ ...choiceRow, opacity: isDisabled ? 0.6 : 1 }}>
          <span style={{ ...radioOuter({ ...style, borderColor: ringColor }), boxShadow: focusRing ? `0 0 0 4px ${focusRing}` : style?.boxShadow }}>
            {isActive ? <span style={radioInner({ color: isDisabled ? "var(--text-muted)" : accent })} /> : null}
          </span>
          <span style={{ fontWeight: 600 }}>{isDisabled ? "Disabled radio" : "Radio label"}</span>
        </label>
      );
    }
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
      const inverseCard = {
        ...baseCard,
        background: snapshot.globals.color.surface.inverse,
        color: snapshot.globals.color.text.inverse,
        border: `1px solid ${snapshot.globals.color.border.default}`
      } as CSSProperties;

      const tabRow = (
        <div style={{ display: "flex", gap: 8 }}>
          {["Overview", "Activity", "Settings"].map((tab, i) => (
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
        <div style={{ display: "grid", gap: 12 }}>
          <div style={baseCard}>
            <div style={{ fontWeight: 700 }}>Dashboard</div>
            {tabRow}
            <div style={{ ...previewCardBase, ...style, borderColor: snapshot.globals.color.border.subtle }}>
              <div style={{ fontWeight: 600 }}>Card title</div>
              <div style={{ color: "var(--text-muted)" }}>Surface context for tabs.</div>
            </div>
          </div>
          <div style={inverseCard}>
            <div style={{ fontWeight: 700 }}>Inverse Surface</div>
            {tabRow}
            <div style={{ ...previewCardBase, ...style, background: "rgba(255,255,255,0.06)", color: snapshot.globals.color.text.inverse }}>
              <div style={{ fontWeight: 600 }}>Card title</div>
              <div style={{ opacity: 0.8 }}>Preview on inverse.</div>
            </div>
          </div>
        </div>
      );
    }
    default:
      return (
        <div style={{ ...previewCardBase, ...style }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{componentId}</div>
          <div style={{ color: "var(--text-muted)" }}>Preview</div>
        </div>
      );
  }
};

const pageGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: 12,
  height: "100%",
  padding: 12
};

const leftRail: CSSProperties = {
  borderRight: "1px solid var(--border)",
  padding: "12px 14px",
  display: "grid",
  gap: 16,
  alignContent: "start",
  background: "var(--surface-alt)"
};

const rightColumn: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  gap: 10,
  minHeight: 0
};

const topRow: CSSProperties = {
  minHeight: 0
};

const bottomRow: CSSProperties = {
  paddingTop: 8,
  display: "grid",
  gap: 10,
  minHeight: 0
};

const visualSection: CSSProperties = {
  background: "var(--surface-alt)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 12,
  boxShadow: "var(--shadow-sm)",
  display: "grid",
  gap: 10,
  minHeight: 0
};

const visualHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};

const stateStrip: CSSProperties = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 4,
  paddingTop: 2
};

const statePill: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 10,
  background: "var(--surface)",
  textAlign: "left",
  display: "grid",
  gap: 6,
  cursor: "pointer",
  transition: "all 160ms ease",
  minWidth: 180
};

const statePillHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "flex-start"
};

const statePreviewSurface: CSSProperties = {
  position: "relative",
  borderRadius: 12,
  padding: 12,
  background: "var(--surface-alt)",
  minHeight: 60,
  border: "1px dashed var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden"
};

const previewAnim: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: "transform 160ms ease, opacity 160ms ease"
};

const ghostLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  pointerEvents: "none",
  opacity: 0.55,
  filter: "blur(0.2px)"
};

const ghostLabel: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "rgba(15,98,254,0.1)",
  color: "#0f62fe",
  borderRadius: 999,
  padding: "2px 8px",
  fontWeight: 700,
  fontSize: 11
};

const controlsHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const controlSection: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  background: "var(--surface-alt)",
  boxShadow: "var(--shadow-sm)",
  padding: 10
};

const sectionDivider: CSSProperties = {
  borderTop: "1px solid var(--border)",
  margin: "4px 0"
};

const summaryRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  gap: 8,
  padding: "4px 0"
};

const controlGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginTop: 8
};

const controlColumn: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 8,
  borderRadius: 10,
  background: "var(--surface)",
  border: "1px solid var(--border)"
};

const miniLabel: CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  fontWeight: 700
};

const stateControlCard: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface)"
};

const subSectionHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
};

const miniGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 8
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: "linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px)",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundRepeat: "no-repeat"
};

const tokenRow: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: 6,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-alt)",
  minHeight: 0
};

const tokenHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8
};

const chip: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(15,98,254,0.12)",
  color: "#0f62fe",
  fontWeight: 700,
  fontSize: 12
};

const railItem: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "var(--surface)",
  cursor: "pointer",
  fontWeight: 600,
  transition: "all 160ms ease",
  color: "var(--text)",
  outline: "none",
  boxShadow: "none"
};

const railItemActive: CSSProperties = {
  border: "1px solid #0f62fe",
  boxShadow: "0 0 0 2px rgba(15,98,254,0.25)",
  background: "var(--surface)"
};

const dangerButton: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #f3b0b0",
  background: "#fff7f7",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow-sm)"
};

const ghostButton: CSSProperties = {
  border: "1px solid var(--border)",
  background: "transparent",
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

const resetLink: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f62fe",
  cursor: "pointer",
  fontWeight: 650
};

const helperText: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 12,
  fontWeight: 600
};

const sectionTitle: CSSProperties = {
  fontWeight: 800,
  fontSize: 16
};

const muted: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 13,
  fontWeight: 600
};

const toggleRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 650
};

const nestedDetails: CSSProperties = {
  border: "1px dashed var(--border)",
  borderRadius: 10,
  padding: 8,
  background: "var(--surface)"
};

const previewButton: CSSProperties = {
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "var(--shadow-sm)",
  width: "100%"
};

const previewInput: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid var(--border)",
  width: "100%",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
};

const previewCardBase: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  border: "1px solid var(--border)",
  minWidth: 200
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

const avatarCircle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #cbd5e1, #e2e8f0)",
  border: "2px solid var(--border)",
  boxShadow: "var(--shadow-sm)"
};

const toastCard: CSSProperties = {
  minWidth: 240,
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
  minWidth: 240,
  maxWidth: 320,
  borderRadius: 14,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface-alt)",
  padding: 16,
  boxShadow: "var(--shadow-md)"
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

const tableShell: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
  minWidth: 260,
  backgroundColor: "var(--surface-alt)",
  boxShadow: "var(--shadow-sm)"
};

const tableHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: "10px 12px",
  fontWeight: 700,
  background: "rgba(15,98,254,0.08)",
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


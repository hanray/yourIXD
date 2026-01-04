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
  const resolveFontSize = (val?: string) => {
    if (!val) return undefined;
    const direct = resolvePath(snapshot, val);
    if (direct && (val.includes(".") || direct !== val)) return direct;
    const sizeMap = snapshot.globals.font.size as Record<string, string>;
    if (val in sizeMap) return sizeMap[val];
    return val;
  };

  const resolveFontFamily = (val?: string) => {
    if (!val) return snapshot.globals.font.family.sans;
    const direct = resolvePath(snapshot, val);
    if (direct && (val.includes(".") || direct !== val)) return direct;
    return val;
  };

  const resolveRadius = (val?: string) => {
    if (!val) return undefined;
    const direct = resolvePath(snapshot, val);
    if (direct && (val.includes(".") || direct !== val)) return direct;
    const radiusMap = snapshot.globals.radius as Record<string, string>;
    if (val in radiusMap) return radiusMap[val];
    return val;
  };

  const resolveShadow = (val?: string) => {
    if (!val) return undefined;
    const direct = resolvePath(snapshot, val);
    if (direct && (val.includes(".") || direct !== val)) return direct;
    const shadowMap = snapshot.globals.shadow as Record<string, string>;
    if (val in shadowMap) return shadowMap[val];
    return val;
  };

  const fg = resolvePath(snapshot, tokens.color?.fg);
  const bg = resolvePath(snapshot, tokens.color?.bg);
  const resolvedBorderColor = resolvePath(snapshot, tokens.color?.border);
  const paddingX = resolvePath(snapshot, tokens.spacing?.paddingX);
  const paddingY = resolvePath(snapshot, tokens.spacing?.paddingY);
  const gap = resolvePath(snapshot, tokens.spacing?.gap);
  const radius = resolveRadius(tokens.radius);
  const shadow = resolveShadow(tokens.shadow);
  const resolvedBorderWidth = resolvePath(snapshot, tokens.border?.width) ?? tokens.border?.width;
  const resolvedBorderStyle = tokens.border?.style ?? (resolvedBorderColor ? "solid" : undefined);
  const typography = tokens.typography ?? {};
  const direction = resolvePath(snapshot, tokens.layout?.direction) ?? tokens.layout?.direction;
  const flexDirection = direction as CSSProperties["flexDirection"] | undefined;
  const resolvedDuration = resolvePath(snapshot, tokens.motion?.duration) ?? snapshot.globals.motion.duration.normal;
  const resolvedEasing = resolvePath(snapshot, tokens.motion?.easing) ?? snapshot.globals.motion.easing.standard;
  const resolvedTransition = tokens.motion?.transition ?? (resolvedDuration && resolvedEasing ? `all ${resolvedDuration} ${resolvedEasing}` : undefined);

  const hasValue = (val: any) => val !== undefined && val !== null && !(typeof val === "string" && val.trim() === "");

  const style: CSSProperties = {
    color: fg,
    backgroundColor: bg,
    boxShadow: shadow,
    borderRadius: radius,
    padding: hasValue(paddingX) && hasValue(paddingY) ? `${paddingY} ${paddingX}` : undefined,
    gap,
    borderColor: resolvedBorderColor,
    borderWidth: resolvedBorderColor ? resolvedBorderWidth ?? "1px" : undefined,
    borderStyle: resolvedBorderColor ? resolvedBorderStyle ?? "solid" : undefined,
    fontSize: resolveFontSize(typography.size),
    fontWeight: typography.weight ? Number(resolvePath(snapshot, typography.weight)) || typography.weight : undefined,
    letterSpacing: resolvePath(snapshot, typography.letterSpacing),
    lineHeight: resolvePath(snapshot, typography.lineHeight),
    fontFamily: resolveFontFamily(typography.fontFamily),
    transition: resolvedTransition,
    flexDirection,
    display: flexDirection ? "flex" : undefined,
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
  disabled?: boolean;
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
  numberUnit,
  disabled = false
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
            disabled={disabled}
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
          <div style={helperText}>Expected tokens like: {options?.slice(0, 3).map((o) => o.value).join(", ")}{(options?.length ?? 0) > 3 ? " ..." : ""}</div>
        </div>
      ) : canUseInput ? (
        <div style={{ display: "grid", gridTemplateColumns: defaultValue ? "1fr auto" : "1fr", gap: 8, alignItems: "center", width: "100%" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              style={{ ...inputStyle, paddingRight: numberUnit ? 40 : inputStyle.paddingRight }}
              value={(() => {
                if (kind !== "number") return localValue ?? "";
                const parsed = Number.parseFloat(localValue.replace("px", ""));
                return Number.isNaN(parsed) ? "" : parsed;
              })()}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder ?? "e.g. 12"}
              type={kind === "number" ? "number" : "text"}
              step={step}
              disabled={disabled}
            />
            {numberUnit === "px" && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 600 }}>
                px
              </span>
            )}
          </div>
          {defaultValue && (
            <button type="button" style={resetLink} onClick={() => handleChange(defaultValue)}>
              Reset
            </button>
          )}
          {kind === "number" && numberUnit === "px" ? (
            <div style={{ height: 16 }} />
          ) : null}
        </div>
      ) : (
        <div style={helperText}>No tokens available - Expected something like {placeholder ?? "a token path (e.g. color.text.primary)"}</div>
      )}
    </label>
  );
};

const gapSupportedComponents = new Set([
  "button",
  "checkbox",
  "radio",
  "toggle",
  "avatar",
  "badge",
  "toast",
  "navbar",
  "footer",
  "tabs",
  "dropdown",
  "select",
  "list-item",
  "modal",
  "table",
  "card"
]);

export const ComponentPage = ({ componentId }: Props) => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const update = useDesignSystem((s) => s.updateComponentTokens);
  const reset = useDesignSystem((s) => s.resetComponentTokens);
  const spec = snapshot.components[componentId];
  const defaultSpec = useMemo(() => defaultSnapshot().components[componentId], [componentId]);
  const [flashKey, setFlashKey] = useState(0);
  const [selectedState, setSelectedState] = useState<string>("default");
  const [compareDefault, setCompareDefault] = useState<boolean>(false);
  const [inversePreview, setInversePreview] = useState<boolean>(false);
  const [showAllStates, setShowAllStates] = useState<boolean>(false);
  const gapAllowed = gapSupportedComponents.has(spec?.id ?? componentId);

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
      <div key={stateKey} style={stateCard}>
        <div style={stateHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{stateKey}</span>
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
          <TokenControl
            label="Direction"
            value={tokens.layout?.direction}
            onChange={(v) => pushUpdate({ layout: mergePart(tokens.layout, { direction: v }) })}
            options={directionOptions}
            placeholder="row | column"
            defaultValue={getDefaultValue(`states.${stateKey}.layout.direction`)}
            allowLiteral={false}
          />
          {stateKey === "loading" && (
            <label style={tokenRow}>
              <div style={tokenHeader}>
                <span style={{ fontWeight: 650 }}>Loading preset</span>
              </div>
              <select
                style={selectStyle}
                value={tokens.motion?.loadingPreset ?? ""}
                onChange={(e) => pushUpdate({ motion: mergePart(tokens.motion, { loadingPreset: e.target.value }) })}
              >
                <option value="">Use theme default ({snapshot.globals.motion.loading?.defaultPreset || "skeleton"})</option>
                {loadingPresetOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    );
  };

  const colorOptions = useMemo(() => flattenTokenOptions(snapshot.globals.color, ["color"]), [snapshot.globals.color]);

  const spaceOptions = useMemo(() => {
    const opts = flattenTokenOptions(snapshot.globals.space, ["space"]);
    return opts.map((opt) => {
      const resolved = resolvePath(snapshot, opt.value);
      const suffix = resolved && resolved !== opt.value ? ` · ${resolved}` : "";
      return { label: `${opt.value}${suffix}`, value: opt.value };
    });
  }, [snapshot, snapshot.globals.space]);

  const radiusOptions = useMemo(() => flattenTokenOptions(snapshot.globals.radius, ["radius"]), [snapshot.globals.radius]);
  const shadowOptions = useMemo(() => flattenTokenOptions(snapshot.globals.shadow, ["shadow"]), [snapshot.globals.shadow]);
  const loadingPresetOptions = useMemo(
    () => Object.keys(snapshot.globals.motion.loading?.presets ?? fallbackLoadingPresets),
    [snapshot.globals.motion.loading]
  );

  const fontSizeOptions = useMemo(() => {
    const options = flattenTokenOptions(snapshot.globals.font.size, ["font", "size"]);
    return options.map((opt) => {
      const resolved = resolvePath(snapshot, opt.value);
      const suffix = resolved && resolved !== opt.value ? ` · ${resolved}` : "";
      return { label: `${opt.value.split(".").pop()}${suffix}`, value: opt.value };
    });
  }, [snapshot, snapshot.globals.font.size]);

  const lineHeightOptions = useMemo(() => flattenTokenOptions(snapshot.globals.lineHeight), [snapshot.globals.lineHeight]);
  const weightOptions = useMemo(() => flattenTokenOptions(snapshot.globals.weight), [snapshot.globals.weight]);
  const borderStyleOptions: Option[] = [
    { label: "solid", value: "solid" },
    { label: "dashed", value: "dashed" },
    { label: "dotted", value: "dotted" },
    { label: "double", value: "double" },
    { label: "none", value: "none" },
    { label: "groove", value: "groove" },
    { label: "ridge", value: "ridge" },
    { label: "inset", value: "inset" },
    { label: "outset", value: "outset" }
  ];
  const fontFamilyOptions = useMemo(() => {
    const primary = (val: string) => val.split(",")[0]?.replace(/["']/g, "").trim() || val;
    const opts: Option[] = [
      { label: primary(snapshot.globals.font.family.sans), value: "font.family.sans" },
      { label: primary(snapshot.globals.font.family.serif), value: "font.family.serif" },
      { label: primary(snapshot.globals.font.family.mono), value: "font.family.mono" }
    ];
    if (snapshot.globals.font.web?.family) {
      opts.push({ label: snapshot.globals.font.web.family, value: "font.web.family" });
    }
    return opts;
  }, [snapshot.globals.font.family, snapshot.globals.font.web?.family]);

  const colorOptionsWithNone = useMemo(() => {
    const noneOpt: Option = { label: "None (no border)", value: "__none__" };
    return [...colorOptions, noneOpt];
  }, [colorOptions]);

  const directionOptions: Option[] = [
    { label: "Row", value: "row" },
    { label: "Column", value: "column" },
    { label: "Row reverse", value: "row-reverse" },
    { label: "Column reverse", value: "column-reverse" }
  ];

  if (!spec) return <div style={{ padding: 24 }}>Component not found</div>;

  const requiredStates = spec?.contract?.requiredStates ?? ["default"];
  const allStates = ["All", ...requiredStates];

  const currentStateTokens = selectedState === "All" ? spec.baseTokens : spec.states?.[selectedState] ?? {};

  const updateSelected = (patch: ComponentTokens) => {
    if (selectedState === "All") {
      // Apply to base tokens and mirror to all states (except loading/selected/disabled) so "All" updates shared defaults.
      update(componentId, "base", componentId, patch);
      requiredStates
        .filter((s) => s !== "loading" && s !== "selected" && s !== "disabled")
        .forEach((stateKey) => update(componentId, "state", stateKey, patch));
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

  const renderBaseGroup = () => (
    <div style={controlSectionFlat}>
      <div style={sectionHeaderFlat}>
        <div style={sectionTitleFlat}>
          {selectedState === "All" ? "This will change the component properties for all states" : `${selectedState} controls`}
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <details style={accordion}>
          <summary style={accordionSummary}>
            <span style={accordionTitle}>Layout</span>
          </summary>
          <div style={accordionBody}>
            <TokenControl
              label="Padding X"
              value={currentStateTokens.spacing?.paddingX ?? spec.baseTokens.spacing?.paddingX}
              onChange={(v) => updateSelected({ spacing: mergePart(currentStateTokens.spacing, { paddingX: v }) })}
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
              onChange={(v) => updateSelected({ spacing: mergePart(currentStateTokens.spacing, { paddingY: v }) })}
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
              onChange={(v) => updateSelected({ spacing: mergePart(currentStateTokens.spacing, { gap: v }) })}
              options={spaceOptions}
              resolveValue={toConcrete}
              placeholder="space.2"
              kind="number"
              defaultValue={getDefaultValue("baseTokens.spacing.gap")}
              forceTokenOnly
              disabled={!gapAllowed}
            />
            {componentId === "list-item" && (
              <>
                <TokenControl
                  label="Stack gap (vertical)"
                  value={currentStateTokens.layout?.stackGap ?? spec.baseTokens.layout?.stackGap}
                  onChange={(v) => updateSelected({ layout: mergePart(currentStateTokens.layout, { stackGap: v }) })}
                  options={spaceOptions}
                  resolveValue={toConcrete}
                  placeholder="space.2"
                  kind="number"
                  defaultValue={getDefaultValue("baseTokens.layout.stackGap")}
                  forceTokenOnly
                />
              </>
            )}
            <TokenControl
              label="Direction"
              value={currentStateTokens.layout?.direction ?? spec.baseTokens.layout?.direction}
              onChange={(v) => updateSelected({ layout: mergePart(currentStateTokens.layout, { direction: v }) })}
              options={directionOptions}
              placeholder="row | column"
              defaultValue={getDefaultValue("baseTokens.layout.direction")}
              allowLiteral={false}
            />
          </div>
        </details>

        <details style={accordion}>
          <summary style={accordionSummary}>
            <span style={accordionTitle}>Color</span>
          </summary>
          <div style={accordionBody}>
            <TokenControl
              label="Text color"
              value={currentStateTokens.color?.fg ?? spec.baseTokens.color?.fg}
              onChange={(v) => updateSelected({ color: mergePart(currentStateTokens.color, { fg: v }) })}
              options={colorOptions}
              resolveValue={toConcrete}
              placeholder="color.text.primary"
              defaultValue={getDefaultValue("baseTokens.color.fg")}
            />
            <TokenControl
              label="Background"
              value={currentStateTokens.color?.bg ?? spec.baseTokens.color?.bg}
              onChange={(v) => updateSelected({ color: mergePart(currentStateTokens.color, { bg: v }) })}
              options={colorOptions}
              resolveValue={toConcrete}
              placeholder="color.surface.elevated"
              defaultValue={getDefaultValue("baseTokens.color.bg")}
            />
            <TokenControl
              label="Border"
              value={currentStateTokens.color?.border ?? spec.baseTokens.color?.border}
              onChange={(v) => {
                if (v === "__none__") {
                  updateSelected({
                    color: mergePart(currentStateTokens.color, { border: "transparent" }),
                    border: mergePart(currentStateTokens.border, { style: "none", width: "0px", color: "transparent" })
                  });
                } else {
                  updateSelected({ color: mergePart(currentStateTokens.color, { border: v }) });
                }
              }}
              options={colorOptionsWithNone}
              resolveValue={toConcrete}
              placeholder="color.border.default"
              defaultValue={getDefaultValue("baseTokens.color.border")}
            />
          </div>
        </details>

        <details style={accordion}>
          <summary style={accordionSummary}>
            <span style={accordionTitle}>Type</span>
          </summary>
          <div style={accordionBody}>
            <TokenControl
              label="Font family"
              value={currentStateTokens.typography?.fontFamily ?? spec.baseTokens.typography?.fontFamily ?? fontFamilyOptions[0]?.value}
              onChange={(v) => updateSelected({ typography: mergePart(currentStateTokens.typography, { fontFamily: v }) })}
              options={fontFamilyOptions}
              resolveValue={toConcrete}
              placeholder="Font family"
              defaultValue={getDefaultValue("baseTokens.typography.fontFamily")}
            />
            <TokenControl
              label="Size"
              value={currentStateTokens.typography?.size ?? spec.baseTokens.typography?.size}
              onChange={(v) => updateSelected({ typography: mergePart(currentStateTokens.typography, { size: v }) })}
              options={fontSizeOptions}
              resolveValue={toConcrete}
              placeholder="font.size.2"
              defaultValue={getDefaultValue("baseTokens.typography.size")}
              forceTokenOnly
            />
            <TokenControl
              label="Line height"
              value={currentStateTokens.typography?.lineHeight ?? spec.baseTokens.typography?.lineHeight}
              onChange={(v) => updateSelected({ typography: mergePart(currentStateTokens.typography, { lineHeight: v }) })}
              options={lineHeightOptions}
              resolveValue={toConcrete}
              placeholder="lineHeight.normal"
              defaultValue={getDefaultValue("baseTokens.typography.lineHeight")}
              forceTokenOnly
            />
            <TokenControl
              label="Weight"
              value={currentStateTokens.typography?.weight ?? spec.baseTokens.typography?.weight}
              onChange={(v) => updateSelected({ typography: mergePart(currentStateTokens.typography, { weight: v }) })}
              options={weightOptions}
              resolveValue={toConcrete}
              placeholder="weight.regular"
              defaultValue={getDefaultValue("baseTokens.typography.weight")}
              forceTokenOnly
            />
          </div>
        </details>

        <details style={accordion}>
          <summary style={accordionSummary}>
            <span style={accordionTitle}>Shape</span>
          </summary>
          <div style={accordionBody}>
            {componentId === "list-item" ? (
              <>
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
                  allowLiteral
                  resolveValue={toConcrete}
                  placeholder="1"
                  kind="number"
                  defaultValue={getDefaultValue("baseTokens.border.width")}
                  onChange={(v) => updateSelected({ border: mergePart(currentStateTokens.border, { width: v }) })}
                  numberUnit="px"
                />
                <TokenControl
                  label="Border style"
                  value={currentStateTokens.border?.style ?? spec.baseTokens.border?.style ?? "solid"}
                  onChange={(v) => {
                    if (v === "none") {
                      updateSelected({ border: mergePart(currentStateTokens.border, { style: "none", width: "0px", color: "transparent" }) });
                    } else {
                      updateSelected({ border: mergePart(currentStateTokens.border, { style: v }) });
                    }
                  }}
                  options={borderStyleOptions}
                  resolveValue={toConcrete}
                  placeholder="solid"
                  defaultValue={getDefaultValue("baseTokens.border.style")}
                  allowLiteral={false}
                />
                <TokenControl
                  label="Divider color"
                  value={currentStateTokens.layout?.dividerColor ?? spec.baseTokens.layout?.dividerColor}
                  onChange={(v) => updateSelected({ layout: mergePart(currentStateTokens.layout, { dividerColor: v }) })}
                  options={colorOptions}
                  resolveValue={toConcrete}
                  placeholder="color.border.subtle"
                  defaultValue={getDefaultValue("baseTokens.layout.dividerColor")}
                />
                <label style={toggleRow}>
                  <input
                    type="checkbox"
                    checked={Boolean(currentStateTokens.layout?.showDivider ?? spec.baseTokens.layout?.showDivider)}
                    onChange={(e) => updateSelected({ layout: mergePart(currentStateTokens.layout, { showDivider: e.target.checked }) })}
                  />
                  <span>Show divider between items</span>
                </label>
                <div style={{ height: 16 }} />
              </>
            ) : (
              <>
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
                  label="Border style"
                  value={currentStateTokens.border?.style ?? spec.baseTokens.border?.style ?? "solid"}
                  onChange={(v) => {
                    if (v === "none") {
                      updateSelected({ border: mergePart(currentStateTokens.border, { style: "none", width: "0px", color: "transparent" }) });
                    } else {
                      updateSelected({ border: mergePart(currentStateTokens.border, { style: v }) });
                    }
                  }}
                  options={borderStyleOptions}
                  resolveValue={toConcrete}
                  placeholder="solid"
                  defaultValue={getDefaultValue("baseTokens.border.style")}
                  allowLiteral={false}
                />
                <TokenControl
                  label="Border width"
                  value={currentStateTokens.border?.width ?? spec.baseTokens.border?.width ?? "1px"}
                  allowLiteral
                  resolveValue={toConcrete}
                  placeholder="1"
                  kind="number"
                  defaultValue={getDefaultValue("baseTokens.border.width")}
                  onChange={(v) => updateSelected({ border: mergePart(currentStateTokens.border, { width: v }) })}
                  numberUnit="px"
                />
              </>
            )}
          </div>
        </details>
      </div>
    </div>
  );

  const inverseTokensPatch: ComponentTokens | undefined = inversePreview
    ? { color: { bg: "color.surface.inverse", fg: "color.text.inverse", border: "color.border.default" } }
    : undefined;

  const globalStateDefaults = snapshot.globals.stateDefaults || {};

  const baselineMerged = mergeTokens(spec.baseTokens, spec.states?.default, inverseTokensPatch);
  const baselineStyle = tokensToStyle(snapshot, baselineMerged);

  const stateTone = (stateKey: string) => {
    // Keep the presentation frame neutral so token edits only affect the component itself.
    const cardBg = "var(--surface)";
    const surfaceBg = "#ffffff";
    const chip = stateKey === "disabled"
      ? { background: "rgba(148, 163, 184, 0.25)", color: "#475569" }
      : { background: "rgba(0,0,0,0.06)", color: "#0f172a" };

    return {
      cardBg,
      surfaceBg,
      borderColor: "transparent",
      chip,
      glow: "var(--shadow-sm)"
    };
  };

  const previewMatrix = () => {
    return (
      <div style={visualSection}>
        <div style={visualHeader}>
          <div>
            <div style={sectionTitleFlat}>Visual states</div>
            <div style={mutedSmall}>States in one strip; selected enlarges, others dim.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Inverse preview</span>
              <button
                type="button"
                onClick={() => setInversePreview((v) => !v)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: inversePreview ? "#0f172a" : "var(--surface)",
                  color: inversePreview ? "#f8fafc" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {inversePreview ? "On" : "Off"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>All states</span>
              <button
                type="button"
                onClick={() => setShowAllStates((v) => !v)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: showAllStates ? "#0f172a" : "var(--surface)",
                  color: showAllStates ? "#f8fafc" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {showAllStates ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
        {(() => {
          const statesToRender = showAllStates ? requiredStates : [selectedState || "default"];
          return (
            <div style={stateStrip}>
              {statesToRender.map((stateKey) => {
            const stateTokens = spec.states?.[stateKey];
            const merged = mergeTokens(spec.baseTokens, (globalStateDefaults as any)[stateKey], stateTokens, inverseTokensPatch);
            const style = tokensToStyle(snapshot, merged);
            const isActive = selectedState === stateKey;
            const showGhost = false;
            const tone = stateTone(stateKey);
            const inherits = !stateTokens;
            const loadingPreset = merged.motion?.loadingPreset ?? snapshot.globals.motion.loading?.defaultPreset ?? "skeleton";

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
                  color: inversePreview ? snapshot.globals.color.text.inverse : undefined,
                  opacity: inherits && !isActive ? 0.7 : 1,
                  transform: isActive ? "scale(1.04)" : "scale(0.98)",
                  boxShadow: isActive ? tone.glow : "var(--shadow-sm)",
                  animation: flashKey ? "previewFlash 0.45s ease" : undefined
                }}
              >
                <div style={statePillHeader}>
                  <span style={{ fontWeight: 750, color: inversePreview ? snapshot.globals.color.text.inverse : undefined }}>{stateKey}</span>
                </div>
                <div style={{ ...statePreviewSurface, background: tone.surfaceBg, borderColor: tone.borderColor }}>
                  {showGhost && (
                    <div style={ghostLayer}>
                      <PreviewExample componentId={spec.id} style={{ ...baselineStyle, opacity: 0.4 }} snapshot={snapshot} stateKey="default" inverseSurface={inversePreview} loadingPreset={loadingPreset} layout={merged.layout} />
                      <span style={ghostLabel}>Default</span>
                    </div>
                  )}
                    <div style={{ ...previewAnim, transform: isActive ? "scale(1.02)" : "scale(0.98)", transition: "transform 180ms ease, opacity 200ms ease" }}>
                      <PreviewExample componentId={spec.id} style={style} snapshot={snapshot} stateKey={stateKey} inverseSurface={inversePreview} loadingPreset={loadingPreset} layout={merged.layout} />
                  </div>
                </div>
              </div>
            );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  const handleReset = () => reset(componentId);

  return (
    <div style={pageGrid}>
      <div style={leftRail}>
        <div>
          <div style={{ fontWeight: 800 }}>{spec?.label ?? componentId}</div>
          <div style={mutedSmall}>Observe first, edit second.</div>
        </div>
        <div style={{ display: "grid", gap: 6 }} role="radiogroup" aria-label="States">
          {allStates.map((state) => {
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
              <div style={sectionTitleFlat}>Controls</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 24, marginTop: 12 }}>
            {renderBaseGroup()}
          </div>
        </div>
      </div>
    </div>
  );
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

type PreviewProps = { componentId: string; style?: CSSProperties; snapshot: DesignSystemSnapshot; stateKey?: string; inverseSurface?: boolean; loadingPreset?: string; layout?: ComponentTokens["layout"] };

const resolveLoadingPreset = (snapshot: DesignSystemSnapshot, presetId?: string) => {
  const motion = snapshot.globals.motion.loading;
  const presets = motion?.presets ?? fallbackLoadingPresets;
  const requested = presetId && presets[presetId as keyof typeof presets] ? presetId : undefined;
  const id = requested ?? motion?.defaultPreset ?? "skeleton";
  const preset = presets[id as keyof typeof presets] ?? fallbackLoadingPresets.skeleton;
  const color = motion?.color || ("color" in preset ? preset.color : undefined) || "#e7f0ff";
  return { id, kind: preset.kind, color } as const;
};

const msNumber = (value?: string) => {
  if (!value) return 0;
  const n = Number.parseFloat(String(value).replace("ms", ""));
  return Number.isFinite(n) ? n : 0;
};

const LoadingPresetPreview = ({ snapshot, presetId }: { snapshot: DesignSystemSnapshot; presetId?: string }) => {
  const duration = snapshot.globals.motion.duration;
  const easing = snapshot.globals.motion.easing.standard;
  const preset = resolveLoadingPreset(snapshot, presetId);
  const dotDurationMs = Math.max(900, Math.round((msNumber(duration.slow) || 320) * 3));
  const dotDuration = `${dotDurationMs}ms`;

  const renderProgress = () => (
    <div style={{ width: "100%", display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 700 }}>Loading progress</div>
      <div style={{ height: 12, borderRadius: 999, background: `${preset.color}22`, overflow: "hidden", border: "1px solid var(--border)" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
  );

  const renderSkeleton = () => (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <div style={{ height: 14, borderRadius: 8, background: preset.color, animation: `ds-pulse ${duration.slow || "320ms"} ${easing} infinite alternate` }} />
      <div style={{ height: 12, width: "85%", borderRadius: 8, background: preset.color, animation: `ds-pulse ${duration.normal || "200ms"} ${easing} infinite alternate` }} />
      <div style={{ height: 12, width: "60%", borderRadius: 8, background: preset.color, animation: `ds-pulse ${duration.fast || "120ms"} ${easing} infinite alternate` }} />
    </div>
  );

  const renderShimmer = () => (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
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
  );

  const renderFadeStack = () => (
    <div style={{ width: "100%", display: "grid", gap: 10 }}>
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
  );

  const renderPulseBar = () => (
    <div style={{ width: "100%", display: "grid", gap: 10 }}>
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
  );

  const renderSlideUp = () => (
    <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
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
  );

  const renderOrbitDots = () => (
    <div style={{ position: "relative", width: 54, height: 54 }}>
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

const PreviewExample = ({ componentId, style, snapshot, stateKey, inverseSurface, loadingPreset, layout }: PreviewProps) => {
  const gapAllowed = gapSupportedComponents.has(componentId);

  if (stateKey === "loading") {
    return <LoadingPresetPreview snapshot={snapshot} presetId={loadingPreset} />;
  }

  const splitGap = (s?: CSSProperties): { container: CSSProperties; rest: CSSProperties } => {
    if (!gapAllowed || !s || !s.gap) return { container: {}, rest: s ?? {} };
    const { gap, display, alignItems, ...rest } = s;
    return {
      container: {
        display: display ?? "inline-flex",
        gap,
        alignItems: alignItems ?? "center"
      },
      rest
    };
  };

  switch (componentId) {
    case "button": {
      const { container, rest } = splitGap(style);
      return <button style={{ ...previewButton, ...rest, ...container }}>Button</button>;
    }
    case "input":
      return <input style={{ ...previewInput, ...style }} placeholder="Type here" />;
    case "dropdown":
      const { container, rest } = splitGap(style);
      const hasGap = Boolean(style?.gap);
      return (
        <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 650 }}>Label</span>
          <div style={{
            ...selectShell,
            ...rest,
            ...container,
            justifyContent: hasGap ? "flex-start" : selectShell.justifyContent
          }}>
            <span>Choose an option</span>
            <span style={caret}>▾</span>
          </div>
        </label>
      );
    case "checkbox": {
      const isDisabled = stateKey === "disabled";
      const isActive = stateKey === "active" || stateKey === "selected" || stateKey === "checked";
      const isFocus = stateKey === "focus" || stateKey === "focus-visible";
      const { container, rest } = splitGap(style);
      const accent = snapshot.globals.color.accent.primary.base;
      const focusRing = isFocus ? `${accent}33` : undefined;
      
      return (
        <label style={{ ...choiceRow, ...container, opacity: isDisabled ? 0.6 : 1 }}>
          <span style={{ 
            ...checkboxBox(rest), 
            boxShadow: focusRing ? `0 0 0 4px ${focusRing}` : rest?.boxShadow,
            backgroundColor: isActive ? (rest?.color || accent) : rest?.backgroundColor
          }} />
          <span style={{ fontWeight: 600 }}>{isDisabled ? "Disabled checkbox" : "Checkbox label"}</span>
        </label>
      );
    }
    case "radio": {
      const isDisabled = stateKey === "disabled";
      const isActive = stateKey === "active" || stateKey === "selected" || stateKey === "checked";
      const isHover = stateKey === "hover";
      const isFocus = stateKey === "focus" || stateKey === "focus-visible";
      const { container, rest } = splitGap(style);

      const accent = snapshot.globals.color.accent.primary.base;
      const ringColor = isDisabled ? rest?.borderColor || "var(--border)" : isActive || isHover || isFocus ? accent : rest?.borderColor || "var(--border)";
      const focusRing = isFocus ? `${accent}33` : undefined;

      return (
        <label style={{ ...choiceRow, ...container, opacity: isDisabled ? 0.6 : 1 }}>
          <span style={{ ...radioOuter({ ...rest, borderColor: ringColor }), boxShadow: focusRing ? `0 0 0 4px ${focusRing}` : rest?.boxShadow }}>
            {isActive ? <span style={radioInner({ color: isDisabled ? "var(--text-muted)" : accent })} /> : null}
          </span>
          <span style={{ fontWeight: 600 }}>{isDisabled ? "Disabled radio" : "Radio label"}</span>
        </label>
      );
    }
    case "toggle": {
      const isDisabled = stateKey === "disabled";
      const isActive = stateKey === "active" || stateKey === "selected" || stateKey === "checked";
      const isFocus = stateKey === "focus" || stateKey === "focus-visible";
      const { container, rest } = splitGap(style);
      const accent = snapshot.globals.color.accent.primary.base;
      const focusRing = isFocus ? `${accent}33` : undefined;
      
      return (
        <label style={{ ...choiceRow, ...container, opacity: isDisabled ? 0.6 : 1 }}>
          <div style={{ 
            ...toggleTrack(rest), 
            position: "relative",
            backgroundColor: isActive ? accent : rest?.backgroundColor,
            boxShadow: focusRing ? `0 0 0 4px ${focusRing}` : rest?.boxShadow
          }}>
            <div style={{
              ...toggleKnob({ ...rest, color: undefined }),
              left: isActive ? 18 : 2,
              background: isActive ? "#ffffff" : rest?.color || "var(--text)"
            }} />
          </div>
          <span style={{ fontWeight: 600 }}>{isDisabled ? "Disabled toggle" : "Toggle label"}</span>
        </label>
      );
    }
    case "badge":
      return <span style={{ ...badge, ...style }}>Badge</span>;
    case "avatar": {
      const isDisabled = stateKey === "disabled";
      const { container, rest } = splitGap(style);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, ...container, opacity: isDisabled ? 0.6 : 1 }}>
          <div style={{ ...avatarCircle, ...rest }} />
          <div>
            <div style={{ fontWeight: 700 }}>Alex Kim</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Product Design</div>
          </div>
        </div>
      );
    }
    case "toast": {
      const { container, rest } = splitGap(style);
      return (
        <div style={{ ...toastCard, ...rest, ...container }}>
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
    }
    case "tooltip":
      return (
        <div style={{ display: "grid", gap: 8, placeItems: "center" }}>
          <div style={{ ...tooltipBubble, ...style }}>
            <div>Tooltip text</div>
          </div>
          <div style={{ width: 32, height: 1, background: "var(--border)" }} />
        </div>
      );
    case "modal": {
      const isDisabled = stateKey === "disabled";
      const { container, rest } = splitGap(style);
      return (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, ...rest, ...container, opacity: isDisabled ? 0.6 : 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Modal title</div>
            <div style={{ color: "var(--text-muted)", marginBottom: 12 }}>Supporting text inside a centered panel.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={ghostButton}>Cancel</button>
              <button style={pillButton}>Save</button>
            </div>
          </div>
        </div>
      );
    }
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
      const { container, rest } = splitGap(style);
      return (
        <div style={{ ...bar, ...rest, ...container }}>
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
    case "footer": {
      const { container, rest } = splitGap(style);
      return (
        <div style={{ ...footerBar, ...rest, ...container }}>
          <span style={{ fontWeight: 700 }}>Product</span>
          <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      );
    }
    case "list-item": {
      const { container, rest } = splitGap(style);
      const stackGap = layout?.stackGap ? resolvePath(snapshot, layout.stackGap) ?? layout.stackGap : undefined;
      const showDivider = Boolean(layout?.showDivider);
      const dividerColor = layout?.dividerColor ? resolvePath(snapshot, layout.dividerColor) ?? layout.dividerColor : snapshot.globals.color.border.subtle;
      return (
        <div style={{ display: "grid", gap: stackGap ?? "12px", width: "100%" }}>
          <div style={{ ...listRow, ...rest, ...container, borderBottom: showDivider ? `1px solid ${dividerColor}` : "none", paddingBottom: showDivider ? 10 : listRow.padding }}>
            <div style={{ ...avatarCircle, width: 36, height: 36 }} />
            <div>
              <div style={{ fontWeight: 700 }}>First item title</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Secondary line</div>
            </div>
          </div>
          <div style={{ ...listRow, ...rest, ...container, opacity: 0.5, borderBottom: showDivider ? `1px solid ${dividerColor}` : "none", paddingBottom: showDivider ? 10 : listRow.padding }}>
            <div style={{ ...avatarCircle, width: 36, height: 36 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Second item</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Another line</div>
            </div>
          </div>
          <div style={{ ...listRow, ...rest, ...container, opacity: 0.5 }}>
            <div style={{ ...avatarCircle, width: 36, height: 36 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Third item</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>More content</div>
            </div>
          </div>
        </div>
      );
    }
    case "divider":
      return <div style={{ ...dividerLine, borderColor: style?.borderColor || "var(--border)" }} />;
    case "tabs": {
      const isDisabled = stateKey === "disabled";
      const baseCard = {
        borderRadius: "16px",
        padding: "16px",
        border: `1px solid ${snapshot.globals.color.border.default}`,
        background: snapshot.globals.color.surface.elevated,
        boxShadow: snapshot.globals.shadow.sm,
        display: "grid",
        opacity: isDisabled ? 0.6 : 1,
        gap: 12
      } as CSSProperties;
      const inverseCard = {
        ...baseCard,
        background: snapshot.globals.color.surface.inverse,
        color: snapshot.globals.color.text.inverse,
        border: `1px solid ${snapshot.globals.color.border.default}`
      } as CSSProperties;

      const tabRow = (isInverse: boolean) => (
        <div style={{ display: "flex", gap: 8 }}>
          {["Overview", "Activity", "Settings"].map((tab, i) => (
            <button
              key={tab}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: i === 0 ? "none" : `1px solid ${snapshot.globals.color.border.subtle}`,
                background: i === 0 ? snapshot.globals.color.accent.primary.base : "transparent",
                color: i === 0 ? snapshot.globals.color.accent.primary.contrast : isInverse ? snapshot.globals.color.text.inverse : snapshot.globals.color.text.primary,
                cursor: "pointer",
                boxShadow: i === 0 ? snapshot.globals.shadow.sm : "none"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      );

      const surfaceCard = inverseSurface ? inverseCard : baseCard;
      const previewCard = inverseSurface
        ? { ...previewCardBase, ...style, background: "rgba(255,255,255,0.06)", color: snapshot.globals.color.text.inverse }
        : { ...previewCardBase, ...style, borderColor: snapshot.globals.color.border.subtle };
      const bodyColor = inverseSurface ? snapshot.globals.color.text.inverse : "var(--text-muted)";

      return (
        <div style={surfaceCard}>
          <div style={{ fontWeight: 700 }}>{inverseSurface ? "Inverse surface" : "Dashboard"}</div>
          {tabRow(Boolean(inverseSurface))}
          <div style={previewCard}>
            <div style={{ fontWeight: 600 }}>Card title</div>
            <div style={{ color: bodyColor }}>
              {inverseSurface ? "Surface context (inverse)." : "Surface context for tabs."}
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
  gridTemplateColumns: "460px 1fr",
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
  gridTemplateRows: "auto auto",
  gap: 12,
  minHeight: 0,
  alignContent: "start"
};

const topRow: CSSProperties = {
  minHeight: 0
};

const bottomRow: CSSProperties = {
  paddingTop: 0,
  display: "grid",
  gap: 10,
  minHeight: 0
};

const visualSection: CSSProperties = {
  background: "var(--surface-alt)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "20px 16px",
  boxShadow: "var(--shadow-sm)",
  display: "grid",
  gap: 12,
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
  paddingTop: 20,
  paddingLeft: 6
};

const statePill: CSSProperties = {
  border: "none",
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
  background: "var(--surface)",
  minHeight: 60,
  border: "none",
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
  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
  color: "var(--primary)",
  borderRadius: "var(--radius-pill)",
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

const controlSectionFlat: CSSProperties = {
  display: "grid",
  gap: 16,
  paddingBottom: 32,
  borderBottom: "1px solid var(--border)"
};

const sectionHeaderFlat: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4
};

const sectionTitleFlat: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--text)",
  marginBottom: 2
};

const mutedSmall: CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  fontWeight: 500
};

const controlGridFlat: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 20,
  marginTop: 8
};

const controlGroup: CSSProperties = {
  display: "grid",
  gap: 12
};

const groupLabel: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
  fontWeight: 700,
  marginBottom: 4
};

const accordion: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "rgba(20, 106, 56, 0.7)",
  padding: "12px 16px 18px"
};

const accordionSummary: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  padding: "8px 4px",
  listStyle: "none",
  color: "#fff"
};

const accordionTitle: CSSProperties = {
  fontWeight: 750,
  fontSize: 14,
  color: "#fff"
};

const accordionBody: CSSProperties = {
  padding: "12px 12px 16px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
  background: "#fff",
  color: "var(--text)",
  borderRadius: 10,
  paddingLeft: 12,
  paddingRight: 12
};

const nestedDetailsFlat: CSSProperties = {
  marginTop: 8,
  paddingTop: 16,
  borderTop: "1px solid #e8ecf0"
};

const summaryRowFlat: CSSProperties = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  color: "var(--text-muted)",
  transition: "color 150ms ease"
};

const sectionDivider: CSSProperties = {
  borderTop: "1px solid var(--border)",
  margin: "8px 0"
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

const stateCard: CSSProperties = {
  padding: "16px 0",
  display: "grid",
  gap: 12
};

const stateHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)"
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
  border: "none",
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
  border: "1px solid var(--primary)",
  boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent)",
  background: "var(--surface)"
};

const dangerButton: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid color-mix(in srgb, var(--color-semantic-danger-base, #e11d48) 40%, transparent)",
  background: "color-mix(in srgb, var(--color-semantic-danger-base, #e11d48) 12%, var(--surface))",
  color: "var(--color-semantic-danger-base, #b91c1c)",
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
  background: "var(--primary)",
  color: "var(--surface-alt)",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow-sm)"
};

const resetLink: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--primary)",
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
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8
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


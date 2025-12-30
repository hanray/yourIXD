import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ComponentTokens, DesignSystemSnapshot } from "@models/designSystem";
import { useDesignSystem } from "@state/store";
import { Surface } from "@components/common/Surface";

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
  const motionTimer = useRef<number>();
  const [motionActive, setMotionActive] = useState(true);

  const tokens = useMemo(() => {
    if (!spec) return undefined;
    const base = spec.baseTokens;
    const stateTokens = stateKey !== "default" ? spec.states?.[stateKey] : undefined;
    const variantTokens = variantKey !== "default" ? spec.variants?.[variantKey] : undefined;
    return mergeTokens(base, stateTokens, variantTokens);
  }, [spec, stateKey, variantKey]);

  const style = tokens ? tokensToStyle(snapshot, tokens) : undefined;
  const loadingPreset = tokens?.motion?.loadingPreset ?? snapshot.globals.motion.loading?.defaultPreset ?? "skeleton";

  useEffect(() => {
    if (motionTimer.current) window.clearTimeout(motionTimer.current);
    setMotionActive(false);
    const start = () => {
      setMotionActive(true);
      const resetMs = Number.parseFloat((snapshot.globals.motion.duration.slow || "320ms").replace("ms", "")) + 80;
      motionTimer.current = window.setTimeout(() => setMotionActive(false), resetMs);
    };
    const id = window.setTimeout(start, 30);
    return () => {
      window.clearTimeout(id);
      if (motionTimer.current) window.clearTimeout(motionTimer.current);
    };
  }, [snapshot.globals.motion.duration, snapshot.globals.motion.easing]);

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
        {spec ? (
          <PreviewExample componentId={spec.id} style={style} snapshot={snapshot} stateKey={stateKey} loadingPreset={loadingPreset} />
        ) : (
          <div style={{ display: "grid", gap: 16, width: "100%" }}>
            <ThemePreview snapshot={snapshot} />
            <MotionPreview
              snapshot={snapshot}
              active={motionActive}
              onReplay={() => {
                if (motionTimer.current) window.clearTimeout(motionTimer.current);
                setMotionActive(false);
                requestAnimationFrame(() => {
                  setMotionActive(true);
                  const resetMs = Number.parseFloat((snapshot.globals.motion.duration.slow || "320ms").replace("ms", "")) + 80;
                  motionTimer.current = window.setTimeout(() => setMotionActive(false), resetMs);
                });
              }}
            />
          </div>
        )}
      </Surface>
    </div>
  );
};

type PreviewProps = {
  componentId: string;
  style?: CSSProperties;
  snapshot: DesignSystemSnapshot;
  stateKey?: string;
  loadingPreset?: string;
};

const resolveLoadingPreset = (snapshot: DesignSystemSnapshot, presetId?: string) => {
  const motion = snapshot.globals.motion.loading;
  const presets = motion?.presets ?? fallbackLoadingPresets;
  const requested = presetId && presets[presetId as keyof typeof presets] ? presetId : undefined;
  const id = requested ?? motion?.defaultPreset ?? "skeleton";
  const preset = presets[id as keyof typeof presets] ?? fallbackLoadingPresets.skeleton;
  const color = motion?.color || preset.color || "#e7f0ff";
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

const PreviewExample = ({ componentId, style, snapshot, stateKey, loadingPreset }: PreviewProps) => {
  if (stateKey === "loading") {
    return <LoadingPresetPreview snapshot={snapshot} presetId={loadingPreset} />;
  }
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

const MotionPreview = ({ snapshot, active, onReplay }: { snapshot: DesignSystemSnapshot; active: boolean; onReplay: () => void }) => {
  const loading = snapshot.globals.motion.loading;
  const loadingColor = loading?.color || snapshot.globals.color.accent.primary.base;
  const barColor = loading?.color || loading?.presets?.progress?.color || loadingColor;

  return (
    <div style={motionBox}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "grid", gap: 2 }}>
          <span style={{ fontWeight: 700 }}>Animation preview</span>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>Uses motion tokens</span>
        </div>
        <button style={pillButton} onClick={onReplay}>Replay</button>
      </div>
      <div style={motionTrack}>
        <div
          style={{
            ...motionDot,
            transform: active ? "translateX(160px)" : "translateX(0px)",
            transition: `transform ${snapshot.globals.motion.duration.fast} ${snapshot.globals.motion.easing.standard}`,
            background: loadingColor
          }}
        />
        <div
          style={{
            ...motionCard,
            transform: active ? "translateY(-6px)" : "translateY(0px)",
            boxShadow: active ? snapshot.globals.shadow.md : snapshot.globals.shadow.sm,
            transition: `transform ${snapshot.globals.motion.duration.normal} ${snapshot.globals.motion.easing.emphasized}, box-shadow ${snapshot.globals.motion.duration.slow} ${snapshot.globals.motion.easing.standard}, background ${snapshot.globals.motion.duration.normal} ${snapshot.globals.motion.easing.standard}`
          }}
        >
          <div style={{ fontWeight: 700 }}>Motion token demo</div>
          <div style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>
            {snapshot.globals.motion.duration.normal} · {snapshot.globals.motion.easing.standard}
          </div>
        </div>
        <div style={loadingRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <span>Loading</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>uses motion.duration.slow</span>
          </div>
          <div style={loadingTrack}>
            <div
              style={{
                ...loadingBar,
                width: active ? "88%" : "18%",
                transition: `width ${snapshot.globals.motion.duration.slow} ${snapshot.globals.motion.easing.standard}`,
                background: barColor
              }}
            />
          </div>
        </div>
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

const motionBox: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 12,
  background: "var(--surface-alt)",
  display: "grid",
  gap: 10
};

const motionTrack: CSSProperties = {
  position: "relative",
  borderRadius: 12,
  padding: 18,
  background: "linear-gradient(90deg, rgba(15,98,254,0.08), transparent)",
  overflow: "hidden",
  minHeight: 180,
  border: "1px dashed var(--border)",
  display: "grid",
  gap: 16
};

const motionCard: CSSProperties = {
  position: "relative",
  borderRadius: 12,
  padding: 14,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-sm)",
  marginLeft: 44
};

const motionDot: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#0f62fe",
  boxShadow: "0 6px 18px rgba(15,98,254,0.35)",
  position: "absolute",
  top: 26,
  left: 18
};

const loadingRow: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 6
};

const loadingTrack: CSSProperties = {
  width: "100%",
  height: 12,
  borderRadius: 999,
  background: "rgba(15,98,254,0.12)",
  overflow: "hidden",
  border: "1px solid var(--border)"
};

const loadingBar: CSSProperties = {
  height: "100%",
  borderRadius: "inherit",
  background: "#0f62fe"
};

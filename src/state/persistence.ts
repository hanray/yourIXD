import { DesignSystemSnapshot } from "@models/designSystem";
import { designSystemSchema } from "@models/designSystem";

const STORAGE_KEY = "design-system-snapshots";

export type SnapshotMeta = { id: string; name: string; description?: string; updatedAt: string };

// Seed snapshot so users can load "Slate Arc" without having to paste JSON manually.
const slateArcSnapshot: DesignSystemSnapshot = {
  id: "ds_slate-arc_001",
  name: "Slate Arc",
  description: "A clean, modern system for product UI: slate neutrals, sharp focus rings, calm motion, and disciplined roles.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: "0.1.0",
  globals: {
    stateDefaults: {
      active: { color: { border: "color.accent.primary.active", bg: "color.accent.primary.active", fg: "color.accent.primary.contrast" }, shadow: "shadow.sm" },
      focus: { color: { border: "color.border.focus" }, shadow: "shadow.md" },
      selected: { color: { border: "color.accent.primary.base", bg: "color.surface.subtle" }, shadow: "shadow.sm" }
    },
    layout: {
      gap: {
        section: "clamp(64px, 8vh, 96px)",
        subsection: "clamp(40px, 5vh, 64px)",
        stack: "24px"
      }
    },
    color: {
      surface: { base: "#f8f9fb", subtle: "#f0f2f6", elevated: "#ffffff", inverse: "#0f172a" },
      text: { primary: "#0f172a", secondary: "#1f2937", muted: "#475569", inverse: "#f8fafc", disabled: "rgba(15, 23, 42, 0.35)" },
      border: { default: "#e2e8f0", subtle: "#edf2f7", focus: "#0f62fe", danger: "#b91c1c" },
      accent: { primary: { base: "#0f62fe", hover: "#0d55dc", active: "#0b49c3", contrast: "#ffffff" } },
      danger: { base: "#b91c1c", hover: "#9f1a1a", active: "#861616", contrast: "#ffffff" },
      icon: {
        default: "color.text.primary",
        muted: "color.text.muted",
        inverse: "color.text.inverse",
        danger: "color.danger.base",
        disabled: "color.text.disabled"
      }
    },
    font: {
      family: {
        sans: "SF Pro Text, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        mono: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace"
      },
      size: { "1": "14px", "2": "16px", "3": "18px", "4": "20px", "5": "24px", "6": "28px" }
    },
    textRole: {
      display: { size: "font.size.6", weight: "weight.semibold", lineHeight: "lineHeight.relaxed" },
      heading: { size: "font.size.5", weight: "weight.semibold", lineHeight: "lineHeight.normal" },
      subheading: { size: "font.size.4", weight: "weight.medium", lineHeight: "lineHeight.normal" },
      body: { size: "font.size.2", weight: "weight.regular", lineHeight: "lineHeight.normal" },
      caption: { size: "font.size.1", weight: "weight.regular", lineHeight: "lineHeight.tight" },
      label: { size: "font.size.1", weight: "weight.medium", lineHeight: "lineHeight.tight" }
    },
    lineHeight: { tight: "1.25", normal: "1.5", relaxed: "1.65" },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    space: { "0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px" },
    radius: { none: "0px", sm: "6px", md: "10px", lg: "14px", full: "999px" },
    shadow: {
      none: "none",
      sm: "0 1px 2px rgba(0,0,0,0.04)",
      md: "0 10px 30px rgba(0,0,0,0.06)",
      lg: "0 20px 40px rgba(0,0,0,0.10)"
    },
    motion: {
      duration: { fast: "120ms", normal: "200ms", slow: "320ms" },
      easing: { standard: "cubic-bezier(0.4, 0.0, 0.2, 1)", emphasized: "cubic-bezier(0.2, 0.0, 0.0, 1)" },
      loading: {
        color: "#e7f0ff",
        defaultPreset: "skeleton",
        presets: {
          skeleton: { kind: "skeleton", color: "#e7f0ff" },
          progress: { kind: "progress", color: "#0f62fe" },
          dots: { kind: "dots", color: "#0f62fe" }
        }
      }
    },
    icons: {
      selectedLibrary: "lucide",
      libraries: {
        lucide: { id: "lucide", name: "Lucide", repoUrl: "https://lucide.dev/", figmaUrl: "https://www.figma.com/community/plugin/939567362549682378/Lucide-Icons" },
        heroicons: { id: "heroicons", name: "Heroicons", repoUrl: "https://heroicons.com/", figmaUrl: "https://www.figma.com/community/file/1058824038701535210/Heroicons" },
        "material-symbols": { id: "material-symbols", name: "Material Symbols", repoUrl: "https://fonts.google.com/icons", figmaUrl: "https://www.figma.com/community/plugin/1033365300214685992/Material-Symbols" },
        phosphor: { id: "phosphor", name: "Phosphor", repoUrl: "https://phosphoricons.com/", figmaUrl: "https://www.figma.com/community/plugin/898620911119764980/Phosphor-Icons" },
        feather: { id: "feather", name: "Feather", repoUrl: "https://feathericons.com/", figmaUrl: "https://www.figma.com/community/plugin/744047966581015514/Feather-Icons" },
        iconoir: { id: "iconoir", name: "Iconoir", repoUrl: "https://iconoir.com/", figmaUrl: "https://www.figma.com/community/plugin/1032295669900064638/Iconoir" },
        tabler: { id: "tabler", name: "Tabler", repoUrl: "https://tabler.io/icons", figmaUrl: "https://www.figma.com/community/plugin/1039031205606069538/Tabler-Icons" },
        streamline: { id: "streamline", name: "Streamline", repoUrl: "https://www.streamlinehq.com/icons", figmaUrl: "https://www.figma.com/community/plugin/743034140212392444/Streamline-Icons" },
        "noun-project": { id: "noun-project", name: "Noun Project", repoUrl: "https://thenounproject.com/", figmaUrl: "https://www.figma.com/community/plugin/744902567238396221/Noun-Project" }
      },
      semanticNames: [
        "icon.add",
        "icon.remove",
        "icon.close",
        "icon.check",
        "icon.chevronDown",
        "icon.chevronRight",
        "icon.arrowLeft",
        "icon.arrowRight",
        "icon.search",
        "icon.settings",
        "icon.info",
        "icon.warning",
        "icon.alert",
        "icon.user",
        "icon.edit",
        "icon.trash",
        "icon.upload",
        "icon.download",
        "icon.externalLink",
        "icon.spinner"
      ],
      mapping: {
        lucide: {
          "icon.add": "plus",
          "icon.remove": "minus",
          "icon.close": "x",
          "icon.check": "check",
          "icon.chevronDown": "chevron-down",
          "icon.chevronRight": "chevron-right",
          "icon.arrowLeft": "arrow-left",
          "icon.arrowRight": "arrow-right",
          "icon.search": "search",
          "icon.settings": "settings",
          "icon.info": "info",
          "icon.warning": "triangle-alert",
          "icon.alert": "octagon-alert",
          "icon.user": "user",
          "icon.edit": "pencil",
          "icon.trash": "trash-2",
          "icon.upload": "upload",
          "icon.download": "download",
          "icon.externalLink": "external-link",
          "icon.spinner": "loader-2"
        },
        heroicons: {},
        "material-symbols": {},
        phosphor: {},
        feather: {},
        iconoir: {},
        tabler: {},
        streamline: {},
        "noun-project": {}
      },
      sizes: {
        desktop: "20px",
        mobile: "18px",
        roles: {
          compact: { label: "Compact", size: "16px" },
          display: { label: "Display", size: "24px" }
        }
      },
      customIcons: []
    }
  },
  components: {
    button: {
      id: "button",
      label: "Button",
      contract: {
        anatomy: { paddingX: "space.4", paddingY: "space.2", gap: "space.2", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.accent.primary.base", text: "color.accent.primary.contrast", border: "color.accent.primary.base", shadow: "shadow.sm" },
        variants: [
          { name: "sm", kind: "size", tokens: { spacing: { paddingX: "space.3", paddingY: "space.1" }, typography: { size: "font.size.1" } } },
          { name: "md", kind: "size" },
          { name: "lg", kind: "size", tokens: { spacing: { paddingX: "space.5", paddingY: "space.3" }, typography: { size: "font.size.3" } } },
          { name: "primary", kind: "intent" },
          { name: "secondary", kind: "intent", tokens: { color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" }, shadow: "shadow.none" } },
          { name: "ghost", kind: "style", tokens: { color: { fg: "color.text.primary", bg: "transparent", border: "transparent" }, shadow: "shadow.none" } }
        ],
        states: {
          default: {},
          hover: { color: { bg: "color.accent.primary.hover", border: "color.accent.primary.hover" }, shadow: "shadow.md" },
          active: { color: { bg: "color.accent.primary.active", border: "color.accent.primary.active" }, shadow: "shadow.sm" },
          focus: { color: { border: "color.border.focus" }, shadow: "shadow.md" },
          disabled: { color: { fg: "color.text.disabled", bg: "color.border.subtle", border: "color.border.subtle" }, shadow: "shadow.none" },
          loading: { color: { fg: "color.text.disabled" } },
          selected: { color: { bg: "color.accent.primary.active" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["borderRadiusCustom", "arbitraryDropShadow"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.accent.primary.base", border: "color.accent.primary.base" },
        typography: { size: "font.size.2", weight: "weight.semibold" },
        spacing: { paddingX: "space.4", paddingY: "space.2", gap: "space.2" },
        radius: "radius.md",
        shadow: "shadow.sm",
        motion: { duration: "motion.duration.normal", easing: "motion.easing.standard" }
      },
      states: {
        hover: { color: { bg: "color.accent.primary.hover", border: "color.accent.primary.hover" }, shadow: "shadow.md" },
        active: { color: { bg: "color.accent.primary.active", border: "color.accent.primary.active" }, shadow: "shadow.sm" },
        focus: { shadow: "shadow.md" },
        disabled: { color: { fg: "color.text.disabled", bg: "color.border.subtle", border: "color.border.subtle" } },
        loading: {},
        selected: {}
      },
      variants: {
        secondary: { color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" }, shadow: "shadow.none" },
        ghost: { color: { fg: "color.text.primary", bg: "transparent", border: "transparent" }, shadow: "shadow.none" }
      }
    },
    input: {
      id: "input",
      label: "Input",
      contract: {
        anatomy: { paddingX: "space.4", paddingY: "space.2", gap: "space.1", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.none" },
        variants: [],
        states: {
          default: {},
          hover: { color: { border: "color.border.focus" }, shadow: "shadow.sm" },
          focus: { color: { border: "color.border.focus" }, shadow: "shadow.md" },
          disabled: { color: { fg: "color.text.disabled", bg: "color.border.subtle", border: "color.border.subtle" }, shadow: "shadow.none" },
          error: { color: { border: "color.border.danger" }, shadow: "shadow.sm" }
        },
        requiredStates: ["default", "hover", "focus", "disabled", "error"],
        forbiddenOverrides: []
      },
      baseTokens: {
        color: { bg: "color.surface.elevated", fg: "color.text.primary", border: "color.border.default", placeholder: "color.text.muted" },
        typography: { size: "font.size.2", weight: "weight.regular" },
        spacing: { paddingX: "space.4", paddingY: "space.2", gap: "space.2" },
        radius: "radius.md",
        shadow: "shadow.none",
        motion: { duration: "motion.duration.normal", easing: "motion.easing.standard" }
      },
      states: {
        hover: { color: { border: "color.border.focus" }, shadow: "shadow.sm" },
        focus: { color: { border: "color.border.focus" }, shadow: "shadow.md" },
        disabled: { color: { fg: "color.text.disabled", bg: "color.border.subtle", border: "color.border.subtle" }, shadow: "shadow.none" },
        error: { color: { border: "color.border.danger" }, shadow: "shadow.sm" }
      }
    },
    card: {
      id: "card",
      label: "Card",
      contract: {
        anatomy: { paddingX: "space.5", paddingY: "space.5", gap: "space.3", radius: "radius.lg", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.sm" },
        variants: [],
        states: {
          default: {},
          hover: { shadow: "shadow.md" },
          active: { shadow: "shadow.sm" }
        },
        requiredStates: ["default", "hover", "active"],
        forbiddenOverrides: []
      },
      baseTokens: {
        color: { bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { padding: "space.5", gap: "space.3" },
        radius: "radius.lg",
        shadow: "shadow.sm",
        motion: { duration: "motion.duration.normal", easing: "motion.easing.standard" }
      },
      states: {
        hover: { shadow: "shadow.md" },
        active: { shadow: "shadow.sm" }
      }
    },
    badge: {
      id: "badge",
      label: "Badge",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.1", gap: "space.1", radius: "radius.full", borderWidth: "1px" },
        semantics: { bg: "color.surface.subtle", text: "color.text.primary", border: "color.border.subtle", shadow: "shadow.none" },
        variants: [
          { name: "info", kind: "intent", tokens: { color: { fg: "color.accent.primary.base", bg: "motion.loading.color", border: "color.border.subtle" } } },
          { name: "danger", kind: "intent", tokens: { color: { fg: "color.danger.contrast", bg: "color.danger.base", border: "color.danger.base" } } }
        ],
        states: { default: {} },
        requiredStates: ["default"],
        forbiddenOverrides: []
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.subtle", border: "color.border.subtle" },
        typography: { size: "font.size.1", weight: "weight.medium" },
        spacing: { paddingX: "space.2", paddingY: "space.1" },
        radius: "radius.full",
        shadow: "shadow.none"
      },
      variants: {
        info: { color: { fg: "color.accent.primary.base", bg: "motion.loading.color", border: "color.border.subtle" } },
        danger: { color: { fg: "color.danger.contrast", bg: "color.danger.base", border: "color.danger.base" } }
      }
    }
  }
};

const readStorage = (): DesignSystemSnapshot[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  let parsed: DesignSystemSnapshot[] = [];

  if (raw) {
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json)) {
        parsed = json.filter((snap) => snap && typeof snap === "object" && snap.id && snap.globals) as DesignSystemSnapshot[];
      }
    } catch (err) {
      console.error("Failed to parse snapshots", err);
    }
  }

  // Merge seeds if missing; prefer user versions when IDs collide.
  const existingIds = new Set(parsed.map((s) => s.id));
  const merged = [...parsed];
  [slateArcSnapshot].forEach((seed) => {
    if (!existingIds.has(seed.id)) merged.push(seed);
  });

  return merged;
};

const writeStorage = (snapshots: DesignSystemSnapshot[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

export const persistence = {
  list(): SnapshotMeta[] {
    return readStorage().map(({ id, name, description, updatedAt }) => ({ id, name, description, updatedAt }));
  },
  save(snapshot: DesignSystemSnapshot) {
    console.log('[Persistence] Saving snapshot:', snapshot.id, snapshot.name);
    const snaps = readStorage();
    const idx = snaps.findIndex((s) => s.id === snapshot.id);
    if (idx >= 0) {
      snaps[idx] = snapshot;
      console.log('[Persistence] Updated existing snapshot at index:', idx);
    } else {
      snaps.push(snapshot);
      console.log('[Persistence] Added new snapshot, total:', snaps.length);
    }
    writeStorage(snaps);
    console.log('[Persistence] Write complete');
  },
  load(id: string): DesignSystemSnapshot | undefined {
    return readStorage().find((s) => s.id === id);
  },
  delete(id: string) {
    const snaps = readStorage().filter((s) => s.id !== id);
    writeStorage(snaps);
  }
};

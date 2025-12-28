import { DesignSystemSnapshot } from "@models/designSystem";
import { createId } from "@utils/ids";

const now = () => new Date().toISOString();

export const defaultSnapshot = (): DesignSystemSnapshot => ({
  id: createId(),
  name: "Neutral Base",
  description: "A calm, neutral system to start from.",
  createdAt: now(),
  updatedAt: now(),
  version: "0.1.0",
  globals: {
    color: {
      surface: {
        base: "#f8f9fb",
        subtle: "#f0f2f6",
        elevated: "#ffffff",
        inverse: "#0f172a"
      },
      text: {
        primary: "#0f172a",
        secondary: "#1f2937",
        muted: "#475569",
        inverse: "#f8fafc",
        disabled: "rgba(15, 23, 42, 0.35)"
      },
      border: {
        default: "#e2e8f0",
        subtle: "#edf2f7",
        focus: "#0f62fe",
        danger: "#b91c1c"
      },
      accent: {
        primary: {
          base: "#0f62fe",
          hover: "#0d55dc",
          active: "#0b49c3",
          contrast: "#ffffff"
        }
      },
      danger: {
        base: "#b91c1c",
        hover: "#9f1a1a",
        active: "#861616",
        contrast: "#ffffff"
      }
    },
    font: {
      family: {
        sans: "SF Pro Text, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        mono: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace"
      },
      size: { 1: "14px", 2: "16px", 3: "18px", 4: "20px", 5: "24px", 6: "28px" }
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
    space: { 0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 8: "32px" },
    radius: { none: "0px", sm: "6px", md: "10px", lg: "14px", full: "999px" },
    shadow: {
      none: "none",
      sm: "0 1px 2px rgba(0,0,0,0.04)",
      md: "0 10px 30px rgba(0,0,0,0.06)",
      lg: "0 20px 40px rgba(0,0,0,0.10)"
    },
    motion: {
      duration: {
        fast: "120ms",
        normal: "200ms",
        slow: "320ms"
      },
      easing: {
        standard: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        emphasized: "cubic-bezier(0.2, 0.0, 0.0, 1)"
      }
    }
  },
  components: {
    button: {
      id: "button",
      label: "Button",
      contract: {
        anatomy: {
          paddingX: "space.4",
          paddingY: "space.2",
          gap: "space.2",
          radius: "radius.md",
          borderWidth: "1px"
        },
        semantics: {
          bg: "color.accent.primary.base",
          text: "color.accent.primary.contrast",
          border: "color.accent.primary.base",
          shadow: "shadow.sm"
        },
        variants: [
          { name: "sm", kind: "size", tokens: { spacing: { paddingX: "space.3", paddingY: "space.1" }, typography: { size: "font.size.1" } } },
          { name: "md", kind: "size" },
          { name: "lg", kind: "size", tokens: { spacing: { paddingX: "space.5", paddingY: "space.3" }, typography: { size: "font.size.3" } } },
          { name: "primary", kind: "intent" },
          { name: "secondary", kind: "intent", tokens: { color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" } } },
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
        secondary: {
          color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" }
        },
        ghost: {
          color: { fg: "color.text.primary", bg: "transparent", border: "transparent" }
        }
      }
    },
    input: {
      id: "input",
      label: "Input",
      contract: {
        anatomy: {
          paddingX: "space.3",
          paddingY: "space.2",
          gap: "space.1",
          radius: "radius.md",
          borderWidth: "1px"
        },
        semantics: {
          bg: "color.surface.elevated",
          text: "color.text.primary",
          border: "color.border.default",
          shadow: "shadow.none"
        },
        variants: [
          { name: "sm", kind: "size", tokens: { spacing: { paddingX: "space.2", paddingY: "space.1" }, typography: { size: "font.size.1" } } },
          { name: "md", kind: "size" },
          { name: "lg", kind: "size", tokens: { spacing: { paddingX: "space.4", paddingY: "space.3" }, typography: { size: "font.size.3" } } },
          { name: "primary", kind: "intent" },
          { name: "error", kind: "intent", tokens: { color: { border: "color.danger.base" } } }
        ],
        states: {
          default: {},
          hover: { color: { border: "color.border.focus" } },
          active: {},
          focus: { color: { border: "color.border.focus" }, shadow: "shadow.sm" },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
          loading: {},
          selected: {},
          error: { color: { border: "color.danger.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected", "error"],
        forbiddenOverrides: ["borderRadiusCustom", "boxShadowCustom"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        typography: { size: "font.size.2", weight: "weight.regular" },
        spacing: { paddingX: "space.3", paddingY: "space.2" },
        radius: "radius.md",
        shadow: "shadow.none"
      },
      states: {
        hover: { color: { border: "color.border.focus" } },
        active: {},
        focus: { color: { border: "color.border.focus" }, shadow: "shadow.sm" },
        disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
        loading: {},
        selected: {},
        error: { color: { border: "color.danger.base" } }
      }
    },
    card: {
      id: "card",
      label: "Card",
      contract: {
        anatomy: { paddingX: "space.6", paddingY: "space.5", gap: "space.3", radius: "radius.lg", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.md" },
        variants: [
          { name: "subtle", kind: "style", tokens: { shadow: "shadow.sm", color: { bg: "color.surface.subtle" } } },
          { name: "elevated", kind: "style" }
        ],
        states: {
          default: {},
          hover: { shadow: "shadow.lg" },
          active: { shadow: "shadow.md" },
          focus: { color: { border: "color.border.focus" } },
          disabled: {},
          loading: {},
          selected: { color: { border: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["arbitraryDropShadow"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.6", paddingY: "space.5" },
        radius: "radius.lg",
        shadow: "shadow.md"
      }
    },
    modal: {
      id: "modal",
      label: "Modal",
      contract: {
        anatomy: { paddingX: "space.6", paddingY: "space.6", gap: "space.3", radius: "radius.lg", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.lg" },
        variants: [
          { name: "panel", kind: "style" },
          { name: "overlay", kind: "style", tokens: { color: { bg: "color.surface.inverse" }, shadow: "shadow.none" } }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: { color: { border: "color.border.focus" } },
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeOverlay", "customBackdropOpacity"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.6", paddingY: "space.6" },
        radius: "radius.lg",
        shadow: "shadow.lg"
      }
    },
    dropdown: {
      id: "dropdown",
      label: "Dropdown/Select",
      contract: {
        anatomy: { paddingX: "space.3", paddingY: "space.2", gap: "space.2", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.sm" },
        variants: [
          { name: "md", kind: "size" },
          { name: "lg", kind: "size", tokens: { spacing: { paddingX: "space.4", paddingY: "space.3" } } },
          { name: "primary", kind: "intent" }
        ],
        states: {
          default: {},
          hover: { color: { border: "color.border.focus" } },
          active: { shadow: "shadow.md" },
          focus: { color: { border: "color.border.focus" }, shadow: "shadow.md" },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
          loading: {},
          selected: { color: { bg: "color.surface.subtle" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeBorder", "arbitraryShadow"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.3", paddingY: "space.2" },
        radius: "radius.md",
        shadow: "shadow.sm"
      }
    },
    checkbox: {
      id: "checkbox",
      label: "Checkbox",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.2", gap: "space.1", radius: "radius.sm", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "primary", kind: "intent" },
          { name: "danger", kind: "intent", tokens: { color: { border: "color.danger.base" } } }
        ],
        states: {
          default: {},
          hover: { color: { border: "color.border.focus" } },
          active: { color: { bg: "color.accent.primary.base", border: "color.accent.primary.base" } },
          focus: { color: { border: "color.border.focus" } },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
          loading: {},
          selected: { color: { bg: "color.accent.primary.base", border: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeFocusRing"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.2", paddingY: "space.2" },
        radius: "radius.sm",
        shadow: "shadow.none"
      },
      states: {
        active: { color: { bg: "color.accent.primary.base", border: "color.accent.primary.base" } },
        disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } }
      }
    },
    radio: {
      id: "radio",
      label: "Radio",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.2", gap: "space.1", radius: "radius.full", borderWidth: "2px" },
        semantics: { bg: "color.surface.elevated", text: "color.accent.primary.base", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "primary", kind: "intent" },
          { name: "sm", kind: "size", tokens: { spacing: { paddingX: "space.1", paddingY: "space.1" } } }
        ],
        states: {
          default: {},
          hover: { color: { border: "color.accent.primary.base" } },
          active: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } },
          focus: { color: { border: "color.accent.primary.base" }, shadow: "shadow.focus" },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
          selected: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } },
          checked: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "selected", "checked"],
        forbiddenOverrides: []
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.surface.elevated", border: "color.border.default" },
        radius: "radius.full",
        spacing: { paddingX: "space.2", paddingY: "space.2" }
      },
      states: {
        hover: { color: { border: "color.accent.primary.base" } },
        active: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } },
        focus: { color: { border: "color.accent.primary.base" }, shadow: "shadow.focus" },
        disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
        selected: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } },
        checked: { color: { fg: "color.accent.primary.base", border: "color.accent.primary.base" } }
      }
    },
    toggle: {
      id: "toggle",
      label: "Toggle/Switch",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.2", gap: "space.1", radius: "radius.full", borderWidth: "1px" },
        semantics: { bg: "color.border.subtle", text: "color.accent.primary.contrast", border: "color.border.subtle", shadow: "shadow.none" },
        variants: [
          { name: "primary", kind: "intent" },
          { name: "sm", kind: "size", tokens: { spacing: { paddingX: "space.1", paddingY: "space.1" } } }
        ],
        states: {
          default: {},
          hover: { color: { border: "color.border.focus" } },
          active: { color: { bg: "color.accent.primary.base", border: "color.accent.primary.base" } },
          focus: { color: { border: "color.border.focus" } },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle", border: "color.border.subtle" } },
          loading: {},
          selected: { color: { bg: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeKnob"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.border.subtle", border: "color.border.subtle" },
        spacing: { paddingX: "space.2", paddingY: "space.2" },
        radius: "radius.full"
      },
      states: {
        active: { color: { bg: "color.accent.primary.base", border: "color.accent.primary.base" } }
      }
    },
    tabs: {
      id: "tabs",
      label: "Tabs",
      contract: {
        anatomy: { paddingX: "space.3", paddingY: "space.2", gap: "space.2", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "underline", kind: "style", tokens: { shadow: "shadow.none" } },
          { name: "pill", kind: "style", tokens: { radius: "radius.full" } }
        ],
        states: {
          default: {},
          hover: { color: { bg: "color.surface.subtle" } },
          active: { color: { bg: "color.surface.elevated", border: "color.border.default" } },
          focus: { color: { border: "color.border.focus" } },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle" } },
          loading: {},
          selected: { color: { bg: "color.surface.elevated", border: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeIndicator"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.3", paddingY: "space.2" },
        radius: "radius.md"
      }
    },
    badge: {
      id: "badge",
      label: "Badge",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.1", gap: "space.1", radius: "radius.full", borderWidth: "0px" },
        semantics: { bg: "color.accent.primary.base", text: "color.accent.primary.contrast", border: "transparent", shadow: "shadow.none" },
        variants: [
          { name: "primary", kind: "intent" },
          { name: "secondary", kind: "intent", tokens: { color: { bg: "color.surface.elevated", fg: "color.text.primary", border: "color.border.default" } } }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: {},
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle" } },
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["extraShadow"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.accent.primary.base" },
        spacing: { paddingX: "space.2", paddingY: "space.1" },
        radius: "radius.full"
      }
    },
    toast: {
      id: "toast",
      label: "Toast",
      contract: {
        anatomy: { paddingX: "space.5", paddingY: "space.3", gap: "space.2", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.md" },
        variants: [
          { name: "info", kind: "intent" },
          { name: "success", kind: "intent", tokens: { color: { border: "color.border.subtle" } } },
          { name: "danger", kind: "intent", tokens: { color: { border: "color.danger.base" } } }
        ],
        states: {
          default: {},
          hover: { shadow: "shadow.lg" },
          active: { shadow: "shadow.md" },
          focus: { color: { border: "color.border.focus" } },
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removePadding"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.5", paddingY: "space.3" },
        radius: "radius.md",
        shadow: "shadow.md"
      }
    },
    tooltip: {
      id: "tooltip",
      label: "Tooltip",
      contract: {
        anatomy: { paddingX: "space.2", paddingY: "space.1", gap: "space.1", radius: "radius.sm", borderWidth: "0px" },
        semantics: { bg: "color.text.primary", text: "color.accent.primary.contrast", border: "transparent", shadow: "shadow.sm" },
        variants: [
          { name: "primary", kind: "intent" },
          { name: "inverse", kind: "style", tokens: { color: { bg: "color.surface.inverse", fg: "color.text.inverse" } } }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: {},
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removePointerSpacing"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.text.primary" },
        spacing: { paddingX: "space.2", paddingY: "space.1" },
        radius: "radius.sm",
        shadow: "shadow.sm"
      }
    },
    table: {
      id: "table",
      label: "Table",
      contract: {
        anatomy: { paddingX: "space.3", paddingY: "space.2", gap: "space.2", radius: "radius.sm", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "compact", kind: "size", tokens: { spacing: { paddingY: "space.1" } } },
          { name: "spacious", kind: "size", tokens: { spacing: { paddingY: "space.3" } } }
        ],
        states: {
          default: {},
          hover: { color: { bg: "color.surface.subtle" } },
          active: {},
          focus: { color: { border: "color.border.focus" } },
          disabled: {},
          loading: {},
          selected: { color: { bg: "color.surface.subtle" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeRowPadding"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.3", paddingY: "space.2" },
        radius: "radius.sm",
        shadow: "shadow.none"
      }
    },
    navbar: {
      id: "navbar",
      label: "Navbar",
      contract: {
        anatomy: { paddingX: "space.6", paddingY: "space.3", gap: "space.3", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.sm" },
        variants: [
          { name: "default", kind: "style" },
          { name: "inverse", kind: "style", tokens: { color: { bg: "color.surface.inverse", fg: "color.text.inverse" } } }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: {},
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeShadow"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.6", paddingY: "space.3" },
        radius: "radius.md",
        shadow: "shadow.sm"
      }
    },
    footer: {
      id: "footer",
      label: "Footer",
      contract: {
        anatomy: { paddingX: "space.6", paddingY: "space.5", gap: "space.3", radius: "radius.md", borderWidth: "1px" },
        semantics: { bg: "color.surface.elevated", text: "color.text.primary", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "default", kind: "style" }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: {},
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removePadding"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "color.surface.elevated", border: "color.border.default" },
        spacing: { paddingX: "space.6", paddingY: "space.5" },
        radius: "radius.md"
      }
    },
    "list-item": {
      id: "list-item",
      label: "List Item",
      contract: {
        anatomy: { paddingX: "space.3", paddingY: "space.2", gap: "space.2", radius: "radius.md", borderWidth: "0px" },
        semantics: { bg: "transparent", text: "color.text.primary", border: "transparent", shadow: "shadow.none" },
        variants: [
          { name: "default", kind: "style" }
        ],
        states: {
          default: {},
          hover: { color: { bg: "color.surface.subtle" } },
          active: { color: { bg: "color.surface.elevated" } },
          focus: { color: { border: "color.border.focus" } },
          disabled: { color: { fg: "color.text.disabled" } },
          loading: {},
          selected: { color: { bg: "color.surface.subtle" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeFocusState"]
      },
      baseTokens: {
        color: { fg: "color.text.primary", bg: "transparent", border: "transparent" },
        spacing: { paddingX: "space.3", paddingY: "space.2" },
        radius: "radius.md"
      },
      states: {
        hover: { color: { bg: "color.surface.subtle" } },
        active: { color: { bg: "color.surface.elevated" } }
      }
    },
    divider: {
      id: "divider",
      label: "Divider",
      contract: {
        anatomy: { paddingX: "space.0", paddingY: "space.1", gap: "space.0", radius: "radius.none", borderWidth: "1px" },
        semantics: { bg: "transparent", text: "color.text.muted", border: "color.border.default", shadow: "shadow.none" },
        variants: [
          { name: "horizontal", kind: "style" },
          { name: "vertical", kind: "style" }
        ],
        states: {
          default: {},
          hover: {},
          active: {},
          focus: {},
          disabled: {},
          loading: {},
          selected: {}
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["changeThickness"]
      },
      baseTokens: {
        color: { border: "color.border.default" },
        spacing: { paddingX: "space.0", paddingY: "space.1" }
      }
    },
    avatar: {
      id: "avatar",
      label: "Avatar",
      contract: {
        anatomy: { paddingX: "space.5", paddingY: "space.5", gap: "space.0", radius: "radius.full", borderWidth: "0px" },
        semantics: { bg: "color.accent.primary.base", text: "color.accent.primary.contrast", border: "transparent", shadow: "shadow.sm" },
        variants: [
          { name: "circle", kind: "style" },
          { name: "rounded", kind: "style", tokens: { radius: "radius.lg" } }
        ],
        states: {
          default: {},
          hover: { shadow: "shadow.md" },
          active: { shadow: "shadow.sm" },
          focus: { color: { border: "color.border.focus" } },
          disabled: { color: { fg: "color.text.disabled", bg: "color.surface.subtle" } },
          loading: {},
          selected: { color: { border: "color.accent.primary.base" } }
        },
        requiredStates: ["default", "hover", "active", "focus", "disabled", "loading", "selected"],
        forbiddenOverrides: ["removeContrast"]
      },
      baseTokens: {
        color: { fg: "color.accent.primary.contrast", bg: "color.accent.primary.base" },
        spacing: { paddingX: "space.5", paddingY: "space.5" },
        radius: "radius.full",
        shadow: "shadow.sm"
      }
    }
  }
});

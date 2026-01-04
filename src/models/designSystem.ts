import { z } from "zod";

export type ColorTokens = {
  surface: {
    base: string;
    subtle: string;
    elevated: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    disabled: string;
  };
  border: {
    default: string;
    subtle: string;
    focus: string;
    danger: string;
  };
  accent: {
    primary: {
      base: string;
      hover: string;
      active: string;
      contrast: string;
    };
  };
  danger: {
    base: string;
    hover: string;
    active: string;
    contrast: string;
  };
};

export type FontTokens = {
  family: {
    sans: string;
    serif: string;
    mono: string;
  };
  size: Record<"1" | "2" | "3" | "4" | "5" | "6", string>;
  web?: {
    family: string;
    source: string;
    kind: "url" | "google";
  };
};

export type TextRoleTokens = {
  display: { size: string; weight: string; lineHeight: string };
  heading: { size: string; weight: string; lineHeight: string };
  subheading: { size: string; weight: string; lineHeight: string };
  body: { size: string; weight: string; lineHeight: string };
  caption: { size: string; weight: string; lineHeight: string };
  label: { size: string; weight: string; lineHeight: string };
};

export type LineHeightTokens = {
  tight: string;
  normal: string;
  relaxed: string;
};

export type WeightTokens = {
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
};

export type SpaceTokens = Record<"0" | "1" | "2" | "3" | "4" | "5" | "6" | "8", string>;

export type RadiusTokens = {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
};

export type ShadowTokens = {
  none: string;
  sm: string;
  md: string;
  lg: string;
};

export type MotionTokens = {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    standard: string;
    emphasized: string;
  };
};

export type Globals = {
  color: ColorTokens;
  font: FontTokens;
  textRole: TextRoleTokens;
  lineHeight: LineHeightTokens;
  weight: WeightTokens;
  space: SpaceTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  motion: MotionTokens;
};

export type ComponentTokens = {
  color?: {
    fg?: string;
    bg?: string;
    border?: string;
  };
  typography?: {
    fontFamily?: string;
    size?: string;
    weight?: string;
    letterSpacing?: string;
    lineHeight?: string;
  };
  spacing?: {
    paddingX?: string;
    paddingY?: string;
    gap?: string;
  };
  radius?: string;
  shadow?: string;
  border?: {
    width?: string;
    style?: string;
    color?: string;
  };
  motion?: {
    transition?: string;
    duration?: string;
    easing?: string;
  };
  layout?: {
    minWidth?: string;
    maxWidth?: string;
  };
};

export type ComponentState = "default" | "hover" | "active" | "focus" | "disabled" | string;
export type VariantName = string;
export type SlotName = string;

export type VariantKind = "size" | "intent" | "style";

export type ComponentContract = {
  anatomy: {
    paddingX: string;
    paddingY: string;
    gap: string;
    radius: string;
    borderWidth: string;
  };
  semantics: {
    bg: string;
    text: string;
    border: string;
    shadow: string;
  };
  variants: Array<{
    name: string;
    kind: VariantKind;
    tokens?: ComponentTokens;
  }>;
  states: Record<ComponentState, ComponentTokens>;
  requiredStates: ComponentState[];
  forbiddenOverrides: string[];
};

export type ComponentSpec = {
  id: string;
  label: string;
  contract: ComponentContract;
  baseTokens: ComponentTokens;
  states?: Record<ComponentState, ComponentTokens>;
  variants?: Record<VariantName, ComponentTokens>;
  slots?: Record<SlotName, ComponentTokens>;
};

export type DesignSystemSnapshot = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  globals: Globals;
  components: Record<string, ComponentSpec>;
};

export const componentIds = [
  "theme",
  "button",
  "input",
  "card",
  "modal",
  "dropdown",
  "checkbox",
  "radio",
  "toggle",
  "tabs",
  "badge",
  "toast",
  "tooltip",
  "table",
  "navbar",
  "footer",
  "list-item",
  "divider",
  "avatar"
];

export const designSystemSchema: z.ZodType<DesignSystemSnapshot> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string(),
  globals: z.object({
    color: z.object({
      surface: z.object({ base: z.string(), subtle: z.string(), elevated: z.string(), inverse: z.string() }),
      text: z.object({ primary: z.string(), secondary: z.string(), muted: z.string(), inverse: z.string(), disabled: z.string() }),
      border: z.object({ default: z.string(), subtle: z.string(), focus: z.string(), danger: z.string() }),
      accent: z.object({
        primary: z.object({ base: z.string(), hover: z.string(), active: z.string(), contrast: z.string() })
      }),
      danger: z.object({ base: z.string(), hover: z.string(), active: z.string(), contrast: z.string() })
    }),
    font: z.object({
      family: z.object({ sans: z.string(), serif: z.string(), mono: z.string() }),
      size: z.object({
        "1": z.string(),
        "2": z.string(),
        "3": z.string(),
        "4": z.string(),
        "5": z.string(),
        "6": z.string()
      }),
      web: z
        .object({
          family: z.string(),
          source: z.string(),
          kind: z.union([z.literal("url"), z.literal("google")])
        })
        .optional()
    }),
    textRole: z.object({
      display: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() }),
      heading: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() }),
      subheading: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() }),
      body: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() }),
      caption: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() }),
      label: z.object({ size: z.string(), weight: z.string(), lineHeight: z.string() })
    }),
    lineHeight: z.object({ tight: z.string(), normal: z.string(), relaxed: z.string() }),
    weight: z.object({ regular: z.number(), medium: z.number(), semibold: z.number(), bold: z.number() }),
    space: z.object({ "0": z.string(), "1": z.string(), "2": z.string(), "3": z.string(), "4": z.string(), "5": z.string(), "6": z.string(), "8": z.string() }),
    radius: z.object({ none: z.string(), sm: z.string(), md: z.string(), lg: z.string(), full: z.string() }),
    shadow: z.object({ none: z.string(), sm: z.string(), md: z.string(), lg: z.string() }),
    motion: z.object({
      duration: z.object({ fast: z.string(), normal: z.string(), slow: z.string() }),
      easing: z.object({ standard: z.string(), emphasized: z.string() })
    })
  }),
  components: z.record(
    z.object({
      id: z.string(),
      label: z.string(),
        contract: z.object({
          anatomy: z.object({
            paddingX: z.string(),
            paddingY: z.string(),
            gap: z.string(),
            radius: z.string(),
            borderWidth: z.string()
          }),
          semantics: z.object({
            bg: z.string(),
            text: z.string(),
            border: z.string(),
            shadow: z.string()
          }),
          variants: z.array(
            z.object({
              name: z.string(),
              kind: z.union([z.literal("size"), z.literal("intent"), z.literal("style")]),
              tokens: z.record(z.any()).optional()
            })
          ),
          states: z.record(z.string(), z.record(z.any())),
          requiredStates: z.array(z.string()),
          forbiddenOverrides: z.array(z.string())
        }),
      baseTokens: z.record(z.any()),
      states: z.record(z.string(), z.any()).optional(),
      variants: z.record(z.string(), z.any()).optional(),
      slots: z.record(z.string(), z.any()).optional()
    })
  )
});

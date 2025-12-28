import { DesignSystemSnapshot } from "@models/designSystem";

const flattenVars = (obj: Record<string, any>, prefix: string[] = []) => {
  const entries: Array<[string, string]> = [];
  Object.entries(obj).forEach(([key, value]) => {
    const path = [...prefix, key];
    if (typeof value === "string") {
      entries.push([`--${path.join("-")}`, value]);
    } else if (typeof value === "number") {
      entries.push([`--${path.join("-")}`, String(value)]);
    } else if (value && typeof value === "object") {
      entries.push(...flattenVars(value, path));
    }
  });
  return entries;
};

export const buildTokensCss = (snapshot: DesignSystemSnapshot) => {
  const vars = flattenVars(snapshot.globals).map(([name, value]) => `  ${name}: ${value};`).join("\n");
  return `:root {\n${vars}\n}`;
};

import { useDesignSystem } from "@state/store";

export const useDirty = () => useDesignSystem((s) => s.dirty);

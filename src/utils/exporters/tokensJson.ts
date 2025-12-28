import { DesignSystemSnapshot } from "@models/designSystem";

export const buildTokensJson = (snapshot: DesignSystemSnapshot) => {
  return {
    globals: snapshot.globals,
    components: Object.fromEntries(
      Object.entries(snapshot.components).map(([key, value]) => [
        key,
        {
          baseTokens: value.baseTokens,
          states: value.states ?? {},
          variants: value.variants ?? {},
          slots: value.slots ?? {}
        }
      ])
    )
  };
};

import { DesignSystemSnapshot } from "@models/designSystem";

export const buildComponentsJson = (snapshot: DesignSystemSnapshot) => ({
  components: Object.fromEntries(
    Object.entries(snapshot.components).map(([id, spec]) => [
      id,
      {
        label: spec.label,
        contract: spec.contract,
        tokens: spec.baseTokens,
        states: spec.states ?? {},
        variants: spec.variants ?? {},
        slots: spec.slots ?? {}
      }
    ])
  )
});

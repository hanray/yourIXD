import { useDesignSystem } from "./store";
import { buildTokensJson } from "@utils/exporters/tokensJson";
import { buildComponentsJson } from "@utils/exporters/componentsJson";
import { buildTokensCss } from "@utils/exporters/tokensCss";

export const useExports = () => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  return {
    tokensJson: buildTokensJson(snapshot),
    componentsJson: buildComponentsJson(snapshot),
    tokensCss: buildTokensCss(snapshot)
  };
};

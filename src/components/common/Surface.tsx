import type { CSSProperties, ReactNode } from "react";

export type SurfacePolarity = "default" | "inverse";

type Props = {
  polarity?: SurfacePolarity;
  style?: CSSProperties;
  children: ReactNode;
};

export const Surface = ({ polarity = "default", style, children }: Props) => (
  <div data-surface={polarity} style={style}>
    {children}
  </div>
);

import type { CSSProperties, ReactNode } from "react";

interface LoadingButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  style?: CSSProperties;
  variant?: "primary" | "secondary" | "ghost";
}

export const LoadingButton = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  style,
  variant = "primary"
}: LoadingButtonProps) => {
  const baseStyle: CSSProperties = {
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontWeight: variant === "primary" ? 700 : 600,
    boxShadow: variant === "primary" ? "var(--shadow-sm)" : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: disabled || loading ? 0.6 : 1,
    transition: `all var(--motion-duration-normal, 180ms) var(--motion-easing-standard, ease)`,
    position: "relative"
  };

  const variantStyles: CSSProperties =
    variant === "primary"
      ? { background: "var(--primary)", color: "var(--surface-alt)", borderColor: "var(--primary)" }
      : variant === "secondary"
        ? { background: "var(--surface-alt)", color: "var(--text)" }
        : { background: "transparent", color: "var(--text)" };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variantStyles, ...style }}
    >
      {loading && (
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>
          ◌
        </span>
      )}
      {children}
    </button>
  );
};

import React from "react";

export const Panel: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <section
    style={{
      background: "var(--surface-alt)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}
  >
    {title && <div style={{ fontWeight: 700 }}>{title}</div>}
    {children}
  </section>
);

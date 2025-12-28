import React from "react";

type Props = {
  label: string;
  input: React.ReactNode;
};

export const Field: React.FC<Props> = ({ label, input }) => (
  <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
    {input}
  </label>
);

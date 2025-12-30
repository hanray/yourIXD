import { useDesignSystem } from "@state/store";
import classNames from "classnames";
import React from "react";

export type SectionItem = { id: string; label: string };

type Props = {
  sections: SectionItem[];
  selected: string;
};

export const Sidebar: React.FC<Props> = ({ sections, selected }) => {
  const select = useDesignSystem((s) => s.selectSection);
  const themeSections = sections.filter((s) => s.id.startsWith("theme"));
  const componentSections = sections.filter((s) => !s.id.startsWith("theme"));

  return (
    <aside
      style={{
        borderRight: "1px solid var(--border)",
        background: "var(--surface-alt)",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%"
      }}
    >
      <SidebarGroup title="Theme" items={themeSections}> 
        {(item) => (
          <SidebarItem key={item.id} active={selected === item.id} label={item.label} onClick={() => select(item.id)} />
        )}
      </SidebarGroup>
      <SidebarGroup title="Components" items={componentSections}>
        {(item) => (
          <SidebarItem key={item.id} active={selected === item.id} label={item.label} onClick={() => select(item.id)} />
        )}
      </SidebarGroup>
    </aside>
  );
};

type GroupProps = {
  title: string;
  items: SectionItem[];
  children: (item: SectionItem) => React.ReactNode;
};

const SidebarGroup: React.FC<GroupProps> = ({ title, items, children }) => (
  <div style={{ padding: "0 12px" }}>
    <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 12px 6px 12px" }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column" }}>{items.map(children)}</div>
  </div>
);

type ItemProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const SidebarItem: React.FC<ItemProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={classNames("sidebar-item", { active })}
    style={{
      border: "none",
      background: "transparent",
      textAlign: "left",
      padding: "10px 14px",
      marginBottom: 4,
      borderRadius: "var(--radius-sm)",
      cursor: "pointer",
      color: "var(--text)",
      transition: "transform 100ms ease"
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
    onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
  >
    <span style={{
      display: "block",
      padding: "8px 10px",
      borderRadius: "8px",
      background: active ? "rgba(15, 98, 254, 0.08)" : "transparent",
      color: active ? "#0f62fe" : "inherit",
      fontWeight: active ? 600 : 500,
      transition: "all 150ms ease"
    }}>
      {label}
    </span>
  </button>
);

import { Sidebar } from "@components/layout/Sidebar";
import { FooterBar } from "@components/layout/FooterBar";
import { ThemeSettingsPage } from "@pages/ThemeSettingsPage";
import { ComponentPage } from "@pages/ComponentPage";
import { TypeScalePage } from "@pages/TypeScalePage";
import { useDesignSystem } from "@state/store";
import { componentIds } from "@models/designSystem";
import "@styles/globals.css";
import { useMemo } from "react";

const App = () => {
  const selected = useDesignSystem((s) => s.selectedSection);
  const snapshot = useDesignSystem((s) => s.snapshot);
  const sections = useMemo(
    () => [
      { id: "theme", label: "Theme Settings" },
      { id: "theme:type-scale", label: "Type Scale" },
      ...componentIds.filter((id) => id !== "theme").map((id) => ({
        id,
        label: snapshot.components[id]?.label ?? id
      }))
    ],
    [snapshot.components]
  );

  return (
    <div style={{ display: "grid", gridTemplateRows: "1fr auto", height: "100vh", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0, overflow: "hidden" }}>
        <Sidebar sections={sections} selected={selected} />
        <main style={{ background: "var(--surface)", minHeight: 0, height: "100%", overflow: "auto" }}>
          {selected === "theme" && <ThemeSettingsPage />}
          {selected === "theme:type-scale" && <TypeScalePage />}
          {selected !== "theme" && selected !== "theme:type-scale" && <ComponentPage componentId={selected} />}
        </main>
      </div>
      <FooterBar />
    </div>
  );
};

export default App;

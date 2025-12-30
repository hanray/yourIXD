import { Sidebar } from "@components/layout/Sidebar";
import { FooterBar } from "@components/layout/FooterBar";
import { ThemeSettingsPage } from "@pages/ThemeSettingsPage";
import { ComponentPage } from "@pages/ComponentPage";
import { TypeScalePage } from "@pages/TypeScalePage";
import { useDesignSystem } from "@state/store";
import { componentIds } from "@models/designSystem";
import "@styles/globals.css";
import { useMemo, useState, useEffect } from "react";
import { Toast } from "@components/common/Toast";
import { useToast } from "@hooks/useToast";

const App = () => {
  const selected = useDesignSystem((s) => s.selectedSection);
  const snapshot = useDesignSystem((s) => s.snapshot);
  const setToastCallback = useDesignSystem((s) => s.setToastCallback);
  const { toasts, remove, show } = useToast();
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  // Register toast callback with store
  useEffect(() => {
    setToastCallback(show);
  }, [setToastCallback, show]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [selected]);

  return (
    <div style={{ display: "grid", gridTemplateRows: "1fr auto", height: "100vh", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0, overflow: "hidden" }}>
        <Sidebar sections={sections} selected={selected} />
        <main style={{
          background: "var(--surface)",
          minHeight: 0,
          height: "100%",
          overflow: "auto",
          opacity: isTransitioning ? 0.7 : 1,
          transition: "opacity 150ms ease-out"
        }}>
          {selected === "theme" && <ThemeSettingsPage />}
          {selected === "theme:type-scale" && <TypeScalePage />}
          {selected !== "theme" && selected !== "theme:type-scale" && <ComponentPage componentId={selected} />}
        </main>
      </div>
      <FooterBar />
      <div style={{ position: "fixed", bottom: 0, right: 0, zIndex: 10000 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default App;

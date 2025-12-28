import { useState } from "react";
import { useDesignSystem } from "@state/store";
import { ExportModal } from "@components/common/ExportModal";

export const FooterBar = () => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const dirty = useDesignSystem((s) => s.dirty);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    setShowExportModal(true);
  };

  return (
    <>
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface-alt)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          fontSize: 14
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong>{snapshot.name}</strong>
          {dirty && <span style={{ color: "#b45309", fontWeight: 600 }}>Unsaved changes</span>}
        </div>
        <button
          onClick={handleExport}
          style={{
            background: "var(--primary)",
            color: "var(--surface-alt)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontWeight: 600,
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer"
          }}
        >
          Export
        </button>
      </footer>
      
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
    </>
  );
};

import React, { useState } from "react";
import JSZip from "jszip";
import { useDesignSystem } from "@state/store";
import {
  exportTokensJson,
  exportComponentsJson,
  exportTokensCss,
  exportFigmaVariablesJson,
  exportReadme,
} from "@utils/exporters/fullExport";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOption {
  id: string;
  name: string;
  description: string;
  filename: string;
  checked: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  
  const [options, setOptions] = useState<ExportOption[]>([
    {
      id: "tokens-json",
      name: "tokens.json",
      description: "Complete token definitions with resolved values",
      filename: "tokens.json",
      checked: true,
    },
    {
      id: "components-json",
      name: "components.json",
      description: "Component contracts, anatomy, and token overrides",
      filename: "components.json",
      checked: true,
    },
    {
      id: "tokens-css",
      name: "tokens.css",
      description: "CSS custom properties for browser use",
      filename: "tokens.css",
      checked: true,
    },
    {
      id: "figma-variables",
      name: "figma-variables.json",
      description: "Figma Variables import mapping",
      filename: "figma-variables.json",
      checked: false,
    },
    {
      id: "readme",
      name: "README.md",
      description: "Usage guide for developers and AI agents",
      filename: "README.md",
      checked: true,
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, checked: !opt.checked } : opt))
    );
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const selectedOptions = options.filter((opt) => opt.checked);
      const zip = new JSZip();

      for (const option of selectedOptions) {
        let content = "";

        switch (option.id) {
          case "tokens-json":
            content = exportTokensJson(snapshot);
            break;
          case "components-json":
            content = exportComponentsJson(snapshot);
            break;
          case "tokens-css":
            content = exportTokensCss(snapshot);
            break;
          case "figma-variables":
            content = exportFigmaVariablesJson(snapshot);
            break;
          case "readme":
            content = exportReadme(snapshot);
            break;
        }

        if (content) {
          zip.file(option.filename, content);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipName = `${snapshot.name || "design-system"}-export.zip`;
      downloadFile(zipBlob, zipName, "application/zip");

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 300);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      alert("Export failed. Please try again.");
    }
  };

  const selectedCount = options.filter((opt) => opt.checked).length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          maxWidth: "560px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 20px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
              color: "#0f172a",
            }}
          >
            Export Design System
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#475569",
              margin: "8px 0 0",
            }}
          >
            Select files to export from <strong>{snapshot.name}</strong>
          </p>
        </div>

        {/* Options List */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {options.map((option) => (
            <label
              key={option.id}
              style={{
                display: "flex",
                gap: "12px",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: option.checked ? "#f8f9fb" : "#ffffff",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => toggleOption(option.id)}
                style={{
                  width: "18px",
                  height: "18px",
                  marginTop: "2px",
                  cursor: "pointer",
                  accentColor: "#0f62fe",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "4px",
                    fontFamily: "SFMono-Regular, Consolas, monospace",
                  }}
                >
                  {option.name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: "1.5",
                  }}
                >
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            {selectedCount} file{selectedCount !== 1 ? "s" : ""} selected
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              disabled={isExporting}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isExporting ? "not-allowed" : "pointer",
                opacity: isExporting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={selectedCount === 0 || isExporting}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor:
                  selectedCount === 0 || isExporting ? "#cbd5e1" : "#0f62fe",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  selectedCount === 0 || isExporting ? "not-allowed" : "pointer",
                transition: "background-color 150ms ease",
              }}
            >
              {isExporting ? "Exporting..." : `Export ${selectedCount} File${selectedCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

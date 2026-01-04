import { useMemo, useState, type CSSProperties } from "react";
import { Panel } from "@components/common/Panel";
import { Field } from "@components/forms/Field";
import { useDesignSystem } from "@state/store";
import { iconLibraries, iconLibraryIds } from "@data/iconLibraries";
import { IconAsset, IconLibraryId } from "@models/designSystem";
import { createId } from "@utils/ids";

const pxToNumber = (value: string | undefined) => Number.parseFloat(String(value || "").replace("px", "")) || 0;
const toPx = (value: number) => `${Math.max(8, Math.round(value))}px`;
const sanitizeSemantic = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/\s+/g, "-").replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
  return normalized.startsWith("icon.") ? normalized : `icon.${normalized}`;
};

const normalizeSvg = (raw: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("No <svg> root found");

  doc.querySelectorAll("script").forEach((node) => node.remove());

  const width = Number.parseFloat(svg.getAttribute("width") || "0") || 24;
  const height = Number.parseFloat(svg.getAttribute("height") || String(width)) || width || 24;
  if (!svg.getAttribute("viewBox")) {
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  svg.removeAttribute("width");
  svg.removeAttribute("height");
  if (!svg.getAttribute("fill") || svg.getAttribute("fill") === "none") {
    svg.setAttribute("fill", "currentColor");
  }
  if (svg.getAttribute("stroke") && svg.getAttribute("stroke") !== "none") {
    svg.setAttribute("stroke", "currentColor");
  }

  return new XMLSerializer().serializeToString(svg);
};

type PendingImport = { file: File; semantic: string; error?: string };

export const IconSettingsPage = () => {
  const snapshot = useDesignSystem((s) => s.snapshot);
  const update = useDesignSystem((s) => s.updateGlobalToken);
  const toast = useDesignSystem((s) => s.toastCallback);
  const icons = snapshot.globals.icons;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [newSemantic, setNewSemantic] = useState("icon.");
  const [showAllPreviews, setShowAllPreviews] = useState(false);

  const selectedLibrary = icons.selectedLibrary;
  const libraryMeta = icons.libraries[selectedLibrary] ?? iconLibraries[selectedLibrary];
  const semanticNames = icons.semanticNames ?? [];
  const mapping = icons.mapping?.[selectedLibrary] ?? {};
  const roleEntries = useMemo(() => Object.entries(icons.sizes.roles || {}), [icons.sizes.roles]);
  const canAddRole = roleEntries.length < 2;
  const customPreview = useMemo(
    () => (showAllPreviews ? icons.customIcons : icons.customIcons.slice(0, 8)),
    [icons.customIcons, showAllPreviews]
  );

  const setLibrary = (id: IconLibraryId) => update("icons.selectedLibrary", id);

  const setSize = (key: "desktop" | "mobile", raw: number) => {
    const value = Number.isFinite(raw) ? toPx(raw) : toPx(16);
    update(`icons.sizes.${key}`, value);
  };

  const addRole = () => {
    if (!canAddRole) return;
    const id = createId().slice(0, 8);
    update(`icons.sizes.roles.${id}`, { label: "Utility", size: "16px" });
  };

  const updateRole = (roleId: string, field: "label" | "size", value: string | number) => {
    const nextValue = field === "size" ? toPx(Number(value)) : String(value);
    update(`icons.sizes.roles.${roleId}.${field}`, nextValue);
  };

  const removeRole = (roleId: string) => update(`icons.sizes.roles.${roleId}`, undefined);

  const addSemantic = () => {
    const normalized = sanitizeSemantic(newSemantic);
    if (!normalized || semanticNames.includes(normalized)) return;

    const nextNames = [...semanticNames, normalized];
    const nextMapping = structuredClone(icons.mapping);
    iconLibraryIds.forEach((id) => {
      if (!nextMapping[id]) nextMapping[id] = {};
      nextMapping[id][normalized] = normalized.replace(/^icon\./, "");
    });

    update("icons.semanticNames", nextNames);
    update("icons.mapping", nextMapping);
    setNewSemantic("icon.");
  };

  const updateMapping = (semantic: string, value: string) => {
    update(`icons.mapping.${selectedLibrary}.${semantic}`, value);
  };

  const removeSemantic = (semantic: string) => {
    const nextNames = semanticNames.filter((name) => name !== semantic);
    const nextMapping = structuredClone(icons.mapping);
    iconLibraryIds.forEach((id) => {
      if (nextMapping[id]) delete nextMapping[id][semantic];
    });
    update("icons.semanticNames", nextNames);
    update("icons.mapping", nextMapping);
  };

  const handleFilePick = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => {
      const base = file.name.replace(/\.svg$/i, "");
      return { file, semantic: sanitizeSemantic(base) } as PendingImport;
    });
    setPendingImports(next);
  };

  const removePendingImport = (semantic: string) => {
    setPendingImports((items) => items.filter((item) => item.semantic !== semantic));
  };

  const importPending = async () => {
    if (pendingImports.length === 0) return;
    const items = pendingImports.filter((item) => sanitizeSemantic(item.semantic));
    try {
      const imported: IconAsset[] = [];
      for (const item of items) {
        const semantic = sanitizeSemantic(item.semantic);
        const raw = await item.file.text();
        const svg = normalizeSvg(raw);
        imported.push({ name: semantic, svg, addedAt: new Date().toISOString(), source: "custom" });
      }
      const merged = [
        ...icons.customIcons.filter((icon) => !imported.some((imp) => imp.name === icon.name)),
        ...imported
      ];
      update("icons.customIcons", merged);
      setPendingImports([]);
      if (toast) toast(`Imported ${imported.length} icon${imported.length > 1 ? "s" : ""}.`, "success");
    } catch (err) {
      console.error("[Icons] Import failed", err);
      if (toast) toast("Import failed. Check SVG validity.", "error");
    }
  };

  const removeCustomIcon = (name: string) => {
    const remaining = icons.customIcons.filter((icon) => icon.name !== name);
    update("icons.customIcons", remaining);
  };

  const semanticRows = semanticNames.map((semantic) => ({
    semantic,
    glyph: mapping[semantic] ?? semantic.replace(/^icon\./, ""),
    isCustom: icons.customIcons.some((icon) => icon.name === semantic)
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 16, padding: 20, height: "100%", overflow: "auto" }}>
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <Panel title="Icon source">
          <Field
            label="Icon library"
            input={(
              <select
                style={inputStyle}
                value={selectedLibrary}
                onChange={(e) => setLibrary(e.target.value as IconLibraryId)}
              >
                {iconLibraryIds.map((id) => (
                  <option key={id} value={id}>
                    {icons.libraries[id]?.name ?? iconLibraries[id].name}
                  </option>
                ))}
              </select>
            )}
          />
          <div style={{ display: "grid", gap: 6, color: "var(--text-muted)", fontSize: 14 }}>
            <a href={libraryMeta?.repoUrl} target="_blank" rel="noreferrer" style={linkStyle}>
              Repository · {libraryMeta?.repoUrl}
            </a>
            <a href={libraryMeta?.figmaUrl} target="_blank" rel="noreferrer" style={linkStyle}>
              Figma source · {libraryMeta?.figmaUrl}
            </a>
            <div style={{ lineHeight: 1.5 }}>
              Icons are referenced by semantic names only and inherit color via currentColor. Switching the library remaps the same semantics to the chosen source.
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>Available sources (with Figma)</div>
              <div style={{ display: "grid", gap: 6 }}>
                {iconLibraryIds.map((id) => (
                  <div key={id} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{icons.libraries[id]?.name ?? iconLibraries[id].name}</span>
                    <a href={icons.libraries[id]?.repoUrl ?? iconLibraries[id].repoUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                      Repo
                    </a>
                    <a href={icons.libraries[id]?.figmaUrl ?? iconLibraries[id].figmaUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                      Figma
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Sizing">
          <div style={{ display: "grid", gap: 12 }}>
            <Field
              label="Desktop icon size"
              input={(
                <input
                  type="number"
                  style={inputStyle}
                  value={pxToNumber(icons.sizes.desktop)}
                  min={8}
                  onChange={(e) => setSize("desktop", Number(e.target.value))}
                />
              )}
            />
            <Field
              label="Mobile icon size"
              input={(
                <input
                  type="number"
                  style={inputStyle}
                  value={pxToNumber(icons.sizes.mobile)}
                  min={8}
                  onChange={(e) => setSize("mobile", Number(e.target.value))}
                />
              )}
            />
            <details open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}>
              <summary style={{ cursor: "pointer", fontWeight: 700, marginBottom: 8 }}>Advanced sizing (max 2 roles)</summary>
              <div style={{ display: "grid", gap: 10 }}>
                {roleEntries.map(([id, role]) => (
                  <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 8, alignItems: "center" }}>
                    <input
                      style={inputStyle}
                      value={role.label}
                      onChange={(e) => updateRole(id, "label", e.target.value)}
                      placeholder="Role label"
                    />
                    <input
                      type="number"
                      style={inputStyle}
                      value={pxToNumber(role.size)}
                      min={8}
                      onChange={(e) => updateRole(id, "size", e.target.value)}
                    />
                    <button style={ghostButton} onClick={() => removeRole(id)}>Remove</button>
                  </div>
                ))}
                <button style={{ ...buttonSecondary, opacity: canAddRole ? 1 : 0.5 }} onClick={addRole} disabled={!canAddRole}>
                  + Add size role
                </button>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Icon size does not set touch targets; padding controls hit areas.
                </div>
              </div>
            </details>
          </div>
        </Panel>

        <Panel title="Semantic mapping">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Icons stay semantic (icon.search, icon.close). Map each semantic to the glyph name for {libraryMeta?.name}. Custom SVG imports must declare a semantic name on import.
            </div>
            {semanticRows.map((row) => (
              <div key={row.semantic} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>
                  {row.semantic}
                  {row.isCustom && <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>(custom)</span>}
                </div>
                <input
                  style={inputStyle}
                  value={row.glyph}
                  onChange={(e) => updateMapping(row.semantic, e.target.value)}
                  placeholder="Glyph name in library"
                />
                <button style={ghostButton} onClick={() => removeSemantic(row.semantic)}>Remove</button>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
              <input
                style={inputStyle}
                value={newSemantic}
                onChange={(e) => setNewSemantic(e.target.value)}
                placeholder="icon.new-action"
              />
              <button style={buttonPrimary} onClick={addSemantic}>Add semantic</button>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <Panel title="Custom SVG imports">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Imported icons are normalized (viewBox, currentColor) and kept at the semantic name you provide.
            </div>
            {customPreview.length > 0 && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>
                    Preview {showAllPreviews ? `(all ${icons.customIcons.length})` : `(first ${customPreview.length})`}
                  </div>
                  {icons.customIcons.length > 8 && (
                    <button style={ghostButton} onClick={() => setShowAllPreviews((v) => !v)}>
                      {showAllPreviews ? "Show less" : `Show all ${icons.customIcons.length}`}
                    </button>
                  )}
                </div>
                <div style={previewGrid}>
                  {customPreview.map((icon) => (
                    <div key={icon.name} style={previewItem} title={icon.name}>
                      <div style={previewGlyph} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                      <div style={previewLabel}>{icon.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input type="file" accept="image/svg+xml" multiple onChange={(e) => handleFilePick(e.target.files)} />
            {pendingImports.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {pendingImports.map((item) => (
                  <div key={item.semantic} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                    <input
                      style={inputStyle}
                      value={item.semantic}
                      onChange={(e) => {
                        const next = pendingImports.map((pending) =>
                          pending.semantic === item.semantic
                            ? { ...pending, semantic: sanitizeSemantic(e.target.value) }
                            : pending
                        );
                        setPendingImports(next);
                      }}
                    />
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{item.file.name}</span>
                    <button style={ghostButton} onClick={() => removePendingImport(item.semantic)}>Remove</button>
                  </div>
                ))}
                <button style={buttonPrimary} onClick={importPending} disabled={pendingImports.length === 0}>
                  Import {pendingImports.length} icon{pendingImports.length === 1 ? "" : "s"}
                </button>
              </div>
            )}
            {icons.customIcons.length > 0 && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 700 }}>Registered custom icons</div>
                {icons.customIcons.map((icon) => (
                  <div key={icon.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{icon.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Added {new Date(icon.addedAt).toLocaleString()}</div>
                    </div>
                    <button style={ghostButton} onClick={() => removeCustomIcon(icon.name)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Guardrails">
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", display: "grid", gap: 6 }}>
            <li>Icons inherit color via currentColor and system motion tokens; no icon-specific animation controls.</li>
            <li>Icon size roles are capped (desktop, mobile, plus two optional roles). Touch targets come from layout padding.</li>
            <li>No icon editor or placement tooling here—semantics only.</li>
            <li>Figma links above are the source of truth; custom assets must be normalized SVGs.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  fontSize: 14
};

const buttonPrimary: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--radius-md)",
  border: "none",
  background: "var(--primary)",
  color: "var(--surface-alt)",
  cursor: "pointer",
  fontWeight: 700
};

const buttonSecondary: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  cursor: "pointer",
  fontWeight: 700
};

const previewGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "var(--space-3)"
};

const previewItem: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-3)",
  display: "grid",
  gap: 6,
  alignContent: "start",
  background: "var(--surface)"
};

const previewGlyph: CSSProperties = {
  width: 32,
  height: 32,
  color: "var(--text)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};

const previewLabel: CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  wordBreak: "break-word"
};

const ghostButton: CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "transparent",
  cursor: "pointer",
  fontWeight: 600
};

const linkStyle: CSSProperties = {
  color: "var(--primary)",
  textDecoration: "none",
  fontWeight: 600
};


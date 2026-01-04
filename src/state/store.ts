import { create } from "zustand";
import { DesignSystemSnapshot, ComponentTokens } from "@models/designSystem";
import type { ToastType } from "@components/common/Toast";
import { defaultSnapshot } from "@data/defaults";
import { persistence } from "./persistence";
import { createId } from "@utils/ids";

export type SectionId = "theme" | string;

export type DesignSystemState = {
  snapshot: DesignSystemSnapshot;
  selectedSection: SectionId;
  dirty: boolean;
  isPersisted: boolean;
  selectSection: (id: SectionId) => void;
  setSnapshot: (snapshot: DesignSystemSnapshot) => void;
  updateGlobalToken: (path: string, value: string | number | undefined) => void;
  updateComponentTokens: (componentId: string, target: "base" | "state" | "variant", key: string, tokens: ComponentTokens) => void;
  resetComponentTokens: (componentId: string) => void;
  saveSnapshot: (meta: { name?: string; description?: string }) => void;
  loadSnapshot: (id: string) => void;
  duplicateSnapshot: (name?: string) => void;
  toastCallback?: (message: string, type?: ToastType) => void;
  setToastCallback: (fn: ((message: string, type?: ToastType) => void) | null) => void;
};

const getDeep = (obj: any, path: string[]) => {
  let node = obj;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
};

const setDeep = (obj: any, path: string[], value: unknown) => {
  if (path.length === 0) return;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    if (value === undefined) {
      delete obj[head];
      return;
    }
    obj[head] = value;
    return;
  }
  if (!obj[head]) obj[head] = {};
  setDeep(obj[head], rest, value);
};

// Initialize with the most recent snapshot from localStorage, or fall back to an in-memory default
const getInitialState = (): { snapshot: DesignSystemSnapshot; isPersisted: boolean } => {
  console.log('[Store Init] Loading initial snapshot from localStorage...');
  const snapshots = persistence.list();
  console.log('[Store Init] Found snapshots:', snapshots.length);
  
  if (snapshots.length > 0) {
    const sorted = snapshots.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const mostRecent = sorted[0];
    console.log('[Store Init] Loading most recent:', mostRecent.name, mostRecent.id);
    const loaded = persistence.load(mostRecent.id);
    if (loaded) {
      console.log('[Store Init] Loaded successfully');
      console.log('[Store Init] Sample color:', loaded.globals.color.accent.primary.base);
      return { snapshot: loaded, isPersisted: true };
    }
  }
  
  console.log('[Store Init] No persisted snapshots found, using in-memory default (not saved)');
  const initial = defaultSnapshot();
  return { snapshot: initial, isPersisted: false };
};

export const useDesignSystem = create<DesignSystemState>((set, get) => {
  const initial = getInitialState();

  return {
    snapshot: initial.snapshot,
    selectedSection: "theme",
    dirty: false,
    isPersisted: initial.isPersisted,
    toastCallback: undefined,
    setToastCallback: (fn) => set({ toastCallback: fn ?? undefined }),
    selectSection: (id) => {
      console.log('[Store] Navigating to section:', id);
      const state = get();
      console.log('[Store] Current snapshot ID:', state.snapshot.id);
      console.log('[Store] Sample color value:', state.snapshot.globals.color.accent.primary.base);
      set({ selectedSection: id });
    },
    setSnapshot: (snapshot) => set({ snapshot, dirty: false, isPersisted: get().isPersisted }),
    updateGlobalToken: (path, value) => {
      set((state) => {
        console.info('[UI] updateGlobalToken', { path, value });
        const parts = path.split(".");
        const globals = structuredClone(state.snapshot.globals);
        const currentValue = getDeep(globals, parts);
        const nextValue =
          value === undefined
            ? undefined
            : typeof currentValue === "number"
              ? Number(value)
              : value;
        setDeep(globals as any, parts, nextValue);
        const nextSnapshot = {
          ...state.snapshot,
          globals,
          updatedAt: new Date().toISOString()
        };
        if (state.isPersisted) {
          console.log('[Store] Auto-saving after updateGlobalToken:', path, '=', value, 'ID:', nextSnapshot.id);
          persistence.save(nextSnapshot);
        } else {
          console.log('[Store] In-memory change (not persisted)');
        }
        return { snapshot: nextSnapshot, dirty: false };
      });
    },
    updateComponentTokens: (componentId, target, key, tokens) => {
      set((state) => {
        console.info('[UI] updateComponentTokens', { componentId, target, key, tokens });
        const nextSnapshot = structuredClone(state.snapshot);
        const comp = nextSnapshot.components[componentId];
        if (!comp) return {} as any;
        if (target === "base") {
          comp.baseTokens = { ...comp.baseTokens, ...tokens };
        } else if (target === "state") {
          comp.states = comp.states || {};
          comp.states[key] = { ...(comp.states[key] || {}), ...tokens };
        } else if (target === "variant") {
          comp.variants = comp.variants || {};
          comp.variants[key] = { ...(comp.variants[key] || {}), ...tokens };
        }
        nextSnapshot.updatedAt = new Date().toISOString();
        if (state.isPersisted) {
          persistence.save(nextSnapshot);
        } else {
          console.log('[Store] In-memory component update (not persisted)');
        }
        return { snapshot: nextSnapshot, dirty: false };
      });
    },
    resetComponentTokens: (componentId) => {
      set((state) => {
        const defaults = defaultSnapshot().components[componentId];
        if (!defaults) return {} as any;
        const nextSnapshot = structuredClone(state.snapshot);
        nextSnapshot.components[componentId] = {
          ...nextSnapshot.components[componentId],
          baseTokens: structuredClone(defaults.baseTokens ?? {}),
          states: structuredClone(defaults.states ?? {}),
          variants: structuredClone(defaults.variants ?? {}),
          slots: structuredClone(defaults.slots ?? {})
        } as any;
        nextSnapshot.updatedAt = new Date().toISOString();
        if (state.isPersisted) {
          persistence.save(nextSnapshot);
        } else {
          console.log('[Store] In-memory reset (not persisted)');
        }
        return { snapshot: nextSnapshot, dirty: false };
      });
    },
    saveSnapshot: ({ name, description }) => {
      const current = get().snapshot;
      
      // ALWAYS create a NEW snapshot with NEW ID when user explicitly saves
      const next: DesignSystemSnapshot = {
        ...structuredClone(current),
        id: createId(), // Always new ID
        name: name ?? `${current.name} (Saved)`,
        description: description ?? current.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('[Store] Saving NEW snapshot:', next.name, next.id);
      persistence.save(next);
      set({ snapshot: next, dirty: false, isPersisted: true });
    },
    loadSnapshot: (id) => {
      console.log('[Store] Loading snapshot:', id);
      const snap = persistence.load(id);
      if (!snap) {
        console.warn('[Store] Snapshot not found:', id, '-> using in-memory default');
        const fallback = defaultSnapshot();
        set({ snapshot: fallback, selectedSection: "theme", dirty: false, isPersisted: false });
        return;
      }
      console.log('[Store] Snapshot loaded successfully:', snap.name);
      console.log('[Store] Sample color after load:', snap.globals.color.accent.primary.base);
      set({ snapshot: structuredClone(snap), selectedSection: "theme", dirty: false, isPersisted: true });
    },
    duplicateSnapshot: (name) => {
      const current = get().snapshot;
      const next: DesignSystemSnapshot = {
        ...structuredClone(current),
        id: createId(),
        name: name ?? `${current.name} Copy`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistence.save(next);
      set({ snapshot: next, dirty: false, isPersisted: true });
    }
  };
});

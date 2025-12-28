import { DesignSystemSnapshot } from "@models/designSystem";
import { designSystemSchema } from "@models/designSystem";

const STORAGE_KEY = "design-system-snapshots";

export type SnapshotMeta = { id: string; name: string; description?: string; updatedAt: string };

const readStorage = (): DesignSystemSnapshot[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Don't validate strictly - allow extra properties for extensibility
    return parsed.filter((snap) => snap && typeof snap === 'object' && snap.id && snap.globals) as DesignSystemSnapshot[];
  } catch (err) {
    console.error("Failed to parse snapshots", err);
    return [];
  }
};

const writeStorage = (snapshots: DesignSystemSnapshot[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
};

export const persistence = {
  list(): SnapshotMeta[] {
    return readStorage().map(({ id, name, description, updatedAt }) => ({ id, name, description, updatedAt }));
  },
  save(snapshot: DesignSystemSnapshot) {
    console.log('[Persistence] Saving snapshot:', snapshot.id, snapshot.name);
    const snaps = readStorage();
    const idx = snaps.findIndex((s) => s.id === snapshot.id);
    if (idx >= 0) {
      snaps[idx] = snapshot;
      console.log('[Persistence] Updated existing snapshot at index:', idx);
    } else {
      snaps.push(snapshot);
      console.log('[Persistence] Added new snapshot, total:', snaps.length);
    }
    writeStorage(snaps);
    console.log('[Persistence] Write complete');
  },
  load(id: string): DesignSystemSnapshot | undefined {
    return readStorage().find((s) => s.id === id);
  },
  delete(id: string) {
    const snaps = readStorage().filter((s) => s.id !== id);
    writeStorage(snaps);
  }
};

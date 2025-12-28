/**
 * Debug utility for inspecting localStorage
 * Open browser console and run: window.debugStorage()
 */

export const debugStorage = () => {
  const STORAGE_KEY = "design-system-snapshots";
  const raw = localStorage.getItem(STORAGE_KEY);
  
  console.group('🔍 Storage Debug');
  console.log('Storage key:', STORAGE_KEY);
  console.log('Raw data length:', raw?.length || 0);
  
  if (!raw) {
    console.warn('No data in localStorage');
    console.groupEnd();
    return null;
  }
  
  try {
    const parsed = JSON.parse(raw);
    console.log('Snapshots count:', Array.isArray(parsed) ? parsed.length : 0);
    
    if (Array.isArray(parsed)) {
      parsed.forEach((snap, idx) => {
        console.group(`Snapshot ${idx + 1}: ${snap.name}`);
        console.log('ID:', snap.id);
        console.log('Updated:', snap.updatedAt);
        console.log('Primary color:', snap.globals?.color?.accent?.primary?.base);
        console.log('Surface base:', snap.globals?.color?.surface?.base);
        console.groupEnd();
      });
    }
    
    console.groupEnd();
    return parsed;
  } catch (err) {
    console.error('Failed to parse:', err);
    console.groupEnd();
    return null;
  }
};

// Add to window for easy access
(window as any).debugStorage = debugStorage;

console.log('💡 Run debugStorage() to inspect localStorage');

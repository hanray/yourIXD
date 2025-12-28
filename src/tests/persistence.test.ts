/**
 * Persistence Tests - Exactly 5 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDesignSystem } from '@state/store';
import { persistence } from '@state/persistence';
import { defaultSnapshot } from '@data/defaults';
import { exportTokensJson, exportComponentsJson, exportTokensCss } from '@utils/exporters/fullExport';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
global.localStorage = localStorageMock as any;

describe('Design System Persistence - 5 Critical Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useDesignSystem.setState({
      snapshot: defaultSnapshot(),
      selectedSection: 'theme',
      dirty: false,
    });
  });

  it('Test 1: App loads with default snapshot', () => {
    const state = useDesignSystem.getState();
    
    expect(state.snapshot).toBeDefined();
    expect(state.snapshot.name).toBe('Neutral Base');
    expect(state.snapshot.globals).toBeDefined();
    expect(state.snapshot.globals.color).toBeDefined();
    expect(state.snapshot.components).toBeDefined();
  });

  it('Test 2: Theme color change saves and persists', () => {
    const { updateGlobalToken, snapshot: initialSnapshot } = useDesignSystem.getState();
    
    // Change a color
    updateGlobalToken('color.accent.primary.base', '#ff0000');
    
    // Verify state updated
    const updatedState = useDesignSystem.getState();
    expect(updatedState.snapshot.globals.color.accent.primary.base).toBe('#ff0000');
    expect(updatedState.dirty).toBe(false); // Should be false after auto-save
    
    // Verify it was saved to localStorage
    const saved = persistence.load(initialSnapshot.id);
    expect(saved).toBeDefined();
    expect(saved?.globals.color.accent.primary.base).toBe('#ff0000');
  });

  it('Test 3: Button component tokens save correctly', () => {
    const { updateComponentTokens, snapshot } = useDesignSystem.getState();
    
    // Update button hover state
    updateComponentTokens('button', 'state', 'hover', {
      color: { bg: '#custom-hover' }
    });
    
    // Verify state
    const state = useDesignSystem.getState();
    expect(state.snapshot.components.button.states?.hover?.color?.bg).toBe('#custom-hover');
    expect(state.dirty).toBe(false);
    
    // Verify persistence
    const saved = persistence.load(snapshot.id);
    expect(saved?.components.button.states?.hover?.color?.bg).toBe('#custom-hover');
  });

  it('Test 4: Snapshot save and reload works', () => {
    const { saveSnapshot, loadSnapshot, updateGlobalToken } = useDesignSystem.getState();
    
    // Make a change
    updateGlobalToken('color.surface.base', '#f0f0f0');
    
    // Save with new name (this also auto-saves)
    saveSnapshot({ name: 'Test Snapshot', description: 'Testing save/load' });
    
    const savedState = useDesignSystem.getState();
    const savedId = savedState.snapshot.id;
    
    expect(savedState.snapshot.name).toBe('Test Snapshot');
    expect(savedState.snapshot.description).toBe('Testing save/load');
    expect(savedState.snapshot.globals.color.surface.base).toBe('#f0f0f0');
    
    // Create a fresh snapshot to simulate a different state
    useDesignSystem.setState({
      snapshot: defaultSnapshot(),
      selectedSection: 'theme',
      dirty: false,
    });
    
    // Verify it's different
    expect(useDesignSystem.getState().snapshot.id).not.toBe(savedId);
    expect(useDesignSystem.getState().snapshot.name).toBe('Neutral Base');
    
    // Load the saved snapshot
    loadSnapshot(savedId);
    
    const reloadedState = useDesignSystem.getState();
    expect(reloadedState.snapshot.name).toBe('Test Snapshot');
    expect(reloadedState.snapshot.globals.color.surface.base).toBe('#f0f0f0');
    expect(reloadedState.dirty).toBe(false);
  });

  it('Test 5: Export functions do not crash', () => {
    const { snapshot } = useDesignSystem.getState();
    
    // Test all export functions
    let tokensJson: string;
    let componentsJson: string;
    let tokensCss: string;
    
    expect(() => {
      tokensJson = exportTokensJson(snapshot);
    }).not.toThrow();
    
    expect(() => {
      componentsJson = exportComponentsJson(snapshot);
    }).not.toThrow();
    
    expect(() => {
      tokensCss = exportTokensCss(snapshot);
    }).not.toThrow();
    
    // Verify outputs are valid
    expect(tokensJson!).toBeTruthy();
    expect(componentsJson!).toBeTruthy();
    expect(tokensCss!).toBeTruthy();
    
    // Verify JSON is parseable
    expect(() => JSON.parse(tokensJson!)).not.toThrow();
    expect(() => JSON.parse(componentsJson!)).not.toThrow();
    
    // Verify CSS contains variables
    expect(tokensCss!).toContain(':root');
    expect(tokensCss!).toContain('--');
  });
});

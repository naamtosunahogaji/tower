/**
 * Aetherguard Save Layout
 *
 * Persisted fields: version, unlockedChapters list, lastChapter index.
 * The SaveManager handles version migration and corruption recovery
 * (returns null for any malformed JSON — the caller resets to defaults).
 */

import { SaveManager, SaveData } from './save-manager';

export interface AetherguardSave extends SaveData {
  unlockedChapters: number[];
  lastChapter: number;
}

export const DEFAULT_SAVE: AetherguardSave = {
  version: 1,
  unlockedChapters: [1],
  lastChapter: 1,
};

const SAVE_KEY = 'aetherguard_save';
const SAVE_VERSION = 1;

const saveManager = new SaveManager<AetherguardSave>(SAVE_KEY, SAVE_VERSION);

/** Load the persisted save or return defaults on missing/corrupt data. */
export function loadSave(): AetherguardSave {
  const loaded = saveManager.load();
  if (!loaded) return { ...DEFAULT_SAVE };
  return {
    version: SAVE_VERSION,
    unlockedChapters: Array.isArray(loaded.unlockedChapters) && loaded.unlockedChapters.length > 0
      ? loaded.unlockedChapters
      : [...DEFAULT_SAVE.unlockedChapters],
    lastChapter: typeof loaded.lastChapter === 'number' ? loaded.lastChapter : DEFAULT_SAVE.lastChapter,
  };
}

/** Persist the current save state. */
export function saveSave(data: AetherguardSave): void {
  saveManager.save({
    unlockedChapters: data.unlockedChapters,
    lastChapter: data.lastChapter,
  });
}

/** Wipe the save (used by "Reset Progress" if added later). */
export function resetSave(): void {
  saveManager.delete();
}

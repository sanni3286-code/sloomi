import { create } from 'zustand';
import { db } from '../lib/db';
import type { AppSettings } from '../types/models';

const DEFAULTS: AppSettings = {
  id: 'settings',
  theme: 'system',
  defaultSound: 'soft-bell',
  autoAdvance: true,
  hapticsEnabled: true,
  onboardingCompleted: false,
};

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  init: () => Promise<void>;
  update: (patch: Partial<Omit<AppSettings, 'id'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULTS,
  hydrated: false,
  init: async () => {
    const existing = await db.settings.get('settings');
    if (existing) {
      set({ settings: existing, hydrated: true });
    } else {
      await db.settings.put(DEFAULTS);
      set({ settings: DEFAULTS, hydrated: true });
    }
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await db.settings.put(next);
  },
}));

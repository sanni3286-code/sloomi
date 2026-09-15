import { create } from 'zustand';
import { db } from '../lib/db';
import { setSoundVolume } from '../lib/sound';
import type { AppSettings } from '../types/models';

const DEFAULTS: AppSettings = {
  id: 'settings',
  theme: 'system',
  defaultSound: 'soft-bell',
  soundVolume: 0.8,
  autoAdvance: true,
  hapticsEnabled: true,
  onboardingCompleted: false,
  googleCalendarConnected: false,
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
    const settings = existing ? { ...DEFAULTS, ...existing } : DEFAULTS;
    if (!existing) await db.settings.put(settings);
    setSoundVolume(settings.soundVolume);
    set({ settings, hydrated: true });
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    if (patch.soundVolume !== undefined) setSoundVolume(next.soundVolume);
    await db.settings.put(next);
  },
}));

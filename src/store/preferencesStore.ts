import { create } from 'zustand';
import { db } from '../lib/db';
import { normalizeKeyword, matchIconByKeyword, DEFAULT_ICON } from '../lib/iconMatcher';
import { DEFAULT_TASK_COLOR, suggestNextColor, TASK_COLORS } from '../lib/colorPalette';
import { DEFAULT_TASK_DURATION_SECONDS } from '../types/models';
import type { UserTaskPreference } from '../types/models';

/**
 * Gelernte persönliche Zuordnungen (Spec §8/§9/§10).
 * Priorität: 1) persönliche Präferenz  2) Keyword-Erkennung  3) Standardwert.
 */
interface PreferencesState {
  byKeyword: Record<string, UserTaskPreference>;
  hydrated: boolean;
  init: () => Promise<void>;
  suggestFor: (title: string, usedColors: string[]) => { icon: string; color: string; durationSeconds: number; fromMemory: boolean };
  recordUsage: (title: string, chosen: { icon: string; color: string; durationSeconds: number; iconManuallySet: boolean }) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  byKeyword: {},
  hydrated: false,
  init: async () => {
    const all = await db.userPreferences.toArray();
    const map: Record<string, UserTaskPreference> = {};
    for (const pref of all) map[pref.normalizedKeyword] = pref;
    set({ byKeyword: map, hydrated: true });
  },
  suggestFor: (title, usedColors) => {
    const normalized = normalizeKeyword(title);
    const pref = normalized ? get().byKeyword[normalized] : undefined;
    const keywordIcon = matchIconByKeyword(title);

    const icon = pref?.preferredIcon ?? keywordIcon ?? DEFAULT_ICON;
    const color = pref?.preferredColor ?? suggestNextColor(usedColors) ?? DEFAULT_TASK_COLOR;
    const durationSeconds = pref?.preferredDurationSeconds ?? DEFAULT_TASK_DURATION_SECONDS;
    return { icon, color, durationSeconds, fromMemory: Boolean(pref) };
  },
  recordUsage: async (title, chosen) => {
    const normalized = normalizeKeyword(title);
    if (!normalized) return;
    const existing = get().byKeyword[normalized];
    const next: UserTaskPreference = {
      normalizedKeyword: normalized,
      preferredIcon: chosen.iconManuallySet || !existing?.iconManuallySet ? chosen.icon : existing.preferredIcon,
      preferredColor: chosen.color,
      preferredDurationSeconds: chosen.durationSeconds,
      iconManuallySet: chosen.iconManuallySet || Boolean(existing?.iconManuallySet),
      updatedAt: Date.now(),
    };
    set({ byKeyword: { ...get().byKeyword, [normalized]: next } });
    await db.userPreferences.put(next);
  },
}));

export const CURATED_COLOR_VALUES = TASK_COLORS.map((c) => c.value);

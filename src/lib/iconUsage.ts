/** Zuletzt verwendete & häufig verwendete Icons für den Icon-Picker (Spec §7), lokal in localStorage. */

const STORAGE_KEY = 'flowtime.icon-usage.v1';

interface UsageEntry {
  icon: string;
  count: number;
  lastUsed: number;
}

function readAll(): UsageEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UsageEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: UsageEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    // localStorage kann in privaten Modi fehlschlagen — dann bleibt der Picker einfach ohne Verlauf.
  }
}

export function recordIconUsage(icon: string) {
  const all = readAll();
  const existing = all.find((e) => e.icon === icon);
  if (existing) {
    existing.count += 1;
    existing.lastUsed = Date.now();
  } else {
    all.push({ icon, count: 1, lastUsed: Date.now() });
  }
  writeAll(all);
}

export function getRecentIcons(limit = 8): string[] {
  return readAll()
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit)
    .map((e) => e.icon);
}

export function getFrequentIcons(limit = 8): string[] {
  return readAll()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e) => e.icon);
}

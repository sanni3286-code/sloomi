/**
 * Lokale, offline funktionierende Icon-Erkennung anhand des Aufgabennamens (Spec §6).
 * Reine Substring-/Keyword-Zuordnung — keine externe KI-Anfrage nötig.
 */

export const DEFAULT_ICON = 'ListTodo';

interface IconKeywordEntry {
  icon: string;
  keywords: string[];
}

export function normalizeKeyword(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()"'„“]/g, '')
    .replace(/\s+/g, ' ');
}

// Reihenfolge: spezifischere/längere Begriffe vor generischen, um Fehltreffer zu vermeiden.
const KEYWORD_ICON_MAP: IconKeywordEntry[] = [
  { icon: 'ShowerHead', keywords: ['duschen', 'dusche', 'schnell duschen', 'abduschen'] },
  { icon: 'Bath', keywords: ['baden', 'badewanne', 'bad nehmen'] },
  { icon: 'Toothbrush', keywords: ['zähne putzen', 'zaehne putzen', 'zähneputzen'] },
  { icon: 'Shirt', keywords: ['anziehen', 'kleidung', 'umziehen', 'fertigmachen', 'klamotten'] },
  { icon: 'Sparkles', keywords: ['haare machen', 'schminken', 'make up', 'makeup', 'stylen'] },
  { icon: 'Coffee', keywords: ['frühstück', 'fruehstueck', 'kaffee', 'kaffee trinken'] },
  { icon: 'CookingPot', keywords: ['kochen', 'kochen gehen', 'abendessen kochen'] },
  { icon: 'Utensils', keywords: ['essen', 'mittagessen', 'abendessen', 'snack'] },
  { icon: 'WashingMachine', keywords: ['wäsche', 'waesche', 'waschen', 'wäsche waschen', 'waschmaschine'] },
  { icon: 'BrushCleaning', keywords: ['staubsaugen', 'saugen', 'durchsaugen', 'wohnzimmer saugen'] },
  { icon: 'SprayCan', keywords: ['putzen', 'bad putzen', 'küche putzen', 'kueche putzen', 'reinigen'] },
  { icon: 'House', keywords: ['aufräumen', 'aufraeumen', 'wohnung', 'ordnung machen'] },
  { icon: 'Trash2', keywords: ['müll', 'muell', 'mülleimer', 'müll rausbringen', 'abfall'] },
  { icon: 'ShoppingBasket', keywords: ['einkaufen', 'einkauf'] },
  { icon: 'ShoppingCart', keywords: ['supermarkt'] },
  { icon: 'ShoppingBag', keywords: ['drogerie', 'apotheke'] },
  { icon: 'Laptop', keywords: ['arbeiten', 'homeoffice', 'home office'] },
  { icon: 'Briefcase', keywords: ['büro', 'buero', 'arbeit'] },
  { icon: 'Mail', keywords: ['e-mail', 'email', 'mails', 'emails checken', 'mail schreiben'] },
  { icon: 'Phone', keywords: ['telefonieren', 'anrufen', 'telefonat'] },
  { icon: 'Users', keywords: ['meeting', 'besprechung', 'call'] },
  { icon: 'PenLine', keywords: ['schreiben', 'notizen'] },
  { icon: 'BookOpen', keywords: ['lernen', 'lesen', 'buch lesen', 'studieren'] },
  { icon: 'Dumbbell', keywords: ['sport', 'training', 'fitness', 'gym', 'workout'] },
  { icon: 'Footprints', keywords: ['joggen', 'laufen', 'spazieren', 'spaziergang'] },
  { icon: 'Bike', keywords: ['fahrrad', 'rad fahren', 'radfahren'] },
  { icon: 'Fuel', keywords: ['tanken'] },
  { icon: 'Car', keywords: ['auto', 'fahrt', 'fahren'] },
  { icon: 'Bus', keywords: ['bus'] },
  { icon: 'TrainFront', keywords: ['bahn', 'zug'] },
  { icon: 'CalendarClock', keywords: ['termin'] },
  { icon: 'Coffee', keywords: ['pause'] },
  { icon: 'Armchair', keywords: ['entspannen', 'chillen', 'relaxen'] },
  { icon: 'Bed', keywords: ['schlafen', 'nickerchen', 'ausschlafen'] },
  { icon: 'Brain', keywords: ['meditieren', 'meditation', 'achtsamkeit'] },
  { icon: 'Dog', keywords: ['hund', 'gassi', 'gassi gehen'] },
  { icon: 'Cat', keywords: ['katze'] },
  { icon: 'Sprout', keywords: ['pflanzen', 'gießen', 'giessen', 'pflanzen gießen'] },
  { icon: 'Backpack', keywords: ['tasche packen', 'tasche', 'rucksack packen'] },
];

/** Sucht anhand von Substring-Übereinstimmungen ein passendes Icon. Gibt null zurück, wenn nichts passt. */
export function matchIconByKeyword(title: string): string | null {
  const normalized = normalizeKeyword(title);
  if (!normalized) return null;

  let best: { icon: string; length: number } | null = null;
  for (const entry of KEYWORD_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        if (!best || keyword.length > best.length) {
          best = { icon: entry.icon, length: keyword.length };
        }
      }
    }
  }
  return best?.icon ?? null;
}

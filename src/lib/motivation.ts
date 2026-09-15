/**
 * Ruhige, neutrale Begleittexte für die laufende Aufgabe (Spec §54: das Faultier bewertet
 * nicht, es begleitet). Bewusst ohne jede Tempo- oder Leistungsaussage.
 */
const PHRASES = [
  'Du schaffst das.',
  'Ganz in Ruhe.',
  'Ein Schritt nach dem anderen.',
  'Alles der Reihe nach.',
  'Immer der Reihe nach.',
];

export function motivationFor(taskId: string): string {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = (hash * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return PHRASES[hash % PHRASES.length];
}

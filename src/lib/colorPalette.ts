/** Kuratierte Farbpalette — Aufgabenfarben sind gezielte Akzente, nicht an Kategorien gekoppelt. */
export const TASK_COLORS: { id: string; label: string; value: string }[] = [
  { id: 'sage', label: 'Salbei', value: '#8CBD9D' },
  { id: 'blue', label: 'Blau', value: '#9FC6E0' },
  { id: 'indigo', label: 'Indigo', value: '#A8B3E0' },
  { id: 'violet', label: 'Violett', value: '#C2ACDD' },
  { id: 'pink', label: 'Pink', value: '#E8AFD1' },
  { id: 'rose', label: 'Rosé', value: '#EBAAAE' },
  { id: 'orange', label: 'Orange', value: '#F0C08A' },
  { id: 'amber', label: 'Bernstein', value: '#EFD388' },
  { id: 'lime', label: 'Limette', value: '#CFDE9B' },
  { id: 'green', label: 'Grün', value: '#A9D9B5' },
  { id: 'cyan', label: 'Türkis', value: '#9BD6D2' },
  { id: 'slate', label: 'Schiefer', value: '#BFC6CE' },
];

export const DEFAULT_TASK_COLOR = TASK_COLORS[0].value;

let cursor = 0;
export function suggestNextColor(usedColors: string[]): string {
  const unused = TASK_COLORS.find((c) => !usedColors.includes(c.value));
  if (unused) return unused.value;
  cursor = (cursor + 1) % TASK_COLORS.length;
  return TASK_COLORS[cursor].value;
}

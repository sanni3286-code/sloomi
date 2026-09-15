/**
 * Liefert eine gut lesbare Vordergrundfarbe (dunkel/hell) für eine gegebene Hintergrundfarbe.
 * Wichtig, weil Aufgabenfarben frei wählbar sind (Spec §9) — ein pastelliger Ton wie Salbei
 * braucht dunklen Text/Icons, ein kräftiger Ton wie Indigo helle.
 */
export function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  return luminance > 0.179 ? '#2f3d34' : '#ffffff';
}

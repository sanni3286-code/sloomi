/** Baut eine korrekte URL zu einer Datei in public/, egal ob die App unter "/" oder einem Unterpfad (z.B. GitHub Pages) läuft. */
export function publicUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

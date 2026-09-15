export function formatClock(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/** Kompakte Dauer wie "1 h 40 min" oder "45 Min." */
export function formatDurationLong(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} Min.`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatDurationMin(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  return `${minutes} Min.`;
}

/** Countdown-Anzeige mm:ss bzw. h:mm:ss für lange Aufgaben. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Signierte Abweichung, z.B. "+12 Min." oder "-5 Min." */
export function formatDeltaMinutes(deltaSeconds: number): string {
  const minutes = Math.round(deltaSeconds / 60);
  if (minutes === 0) return 'pünktlich';
  const sign = minutes > 0 ? '+' : '−';
  return `${sign}${Math.abs(minutes)} Min.`;
}

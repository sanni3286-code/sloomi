/**
 * Lokale Benachrichtigungen (Spec §30).
 *
 * Technische Grenzen bewusst berücksichtigt: iOS Safari/PWA erlaubt Web-Notifications
 * nur für zum Homescreen hinzugefügte Apps und garantiert keine Zustellung, wenn die
 * App vollständig beendet wurde. Notification-Action-Buttons (Start/Überspringen direkt
 * aus der Benachrichtigung) benötigen einen Service-Worker mit `notificationclick`-Handling
 * und funktionieren nicht auf allen Plattformen zuverlässig — hier daher bewusst auf
 * einfache Titel/Text-Benachrichtigungen beschränkt; die eigentliche Aktion erfolgt beim
 * Zurückkehren in die App über die dort sichtbaren Buttons.
 */
import { publicUrl } from './publicUrl';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function notifyTaskTransition(finishedTitle: string, nextTitle: string | null, nextDurationLabel: string | null) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  const body = nextTitle ? `Als Nächstes: ${nextTitle}${nextDurationLabel ? ` · ${nextDurationLabel}` : ''}` : 'Alle Aufgaben erledigt.';
  try {
    new Notification(`${finishedTitle} abgeschlossen`, {
      body,
      icon: publicUrl('pwa-192.png'),
      tag: 'flowtime-task-transition',
    });
  } catch {
    // Manche Browser werfen, wenn Notifications im aktuellen Kontext nicht erlaubt sind.
  }
}

/**
 * Google Calendar Lesezugriff über Google Identity Services (client-seitiger Token-Flow,
 * kein eigener Server nötig). Zeigt bewusst nur die heutigen Termine an — sloomi bleibt
 * kein Kalender-Ersatz, sondern nutzt sie nur zur zeitlichen Orientierung (Spec §48).
 */

export const GOOGLE_CLIENT_ID = '408831924820-pkmb8gn2nkkvocqu9nnheo78po2s3vg0.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
            error_callback?: (err: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services konnte nicht geladen werden.'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

/**
 * Fordert ein Zugriffstoken an. `silent` versucht es ohne sichtbare Nutzerinteraktion
 * (funktioniert nur, wenn zuvor bereits zugestimmt wurde und die Google-Sitzung noch aktiv ist).
 */
export async function requestAccessToken(silent: boolean): Promise<string> {
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error(resp.error ?? 'Kein Zugriffstoken erhalten.'));
      },
      error_callback: (err) => reject(new Error(err.type ?? 'Anmeldung abgebrochen.')),
    });
    client.requestAccessToken(silent ? { prompt: 'none' } : undefined);
  });
}

interface RawEvent {
  id: string;
  summary?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  status: string;
}

function parseEvents(items: RawEvent[]): CalendarEvent[] {
  return items
    .filter((item) => item.status !== 'cancelled')
    .map((item) => {
      const allDay = Boolean(item.start.date && !item.start.dateTime);
      return {
        id: item.id,
        title: item.summary || '(Ohne Titel)',
        start: new Date(item.start.dateTime ?? item.start.date ?? Date.now()),
        end: new Date(item.end.dateTime ?? item.end.date ?? Date.now()),
        allDay,
      };
    });
}

async function fetchEvents(accessToken: string, params: URLSearchParams): Promise<CalendarEvent[]> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('unauthorized');
    throw new Error(`Kalender konnte nicht geladen werden (${res.status}).`);
  }

  const data = await res.json();
  return parseEvents((data.items ?? []) as RawEvent[]);
}

export async function fetchTodaysEvents(accessToken: string): Promise<CalendarEvent[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return fetchEvents(
    accessToken,
    new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '15',
    }),
  );
}

/** Nächste anstehende Termine ab morgen (kein Enddatum), zur Wochenvorschau. */
export async function fetchUpcomingEvents(accessToken: string, maxResults = 8): Promise<CalendarEvent[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  return fetchEvents(
    accessToken,
    new URLSearchParams({
      timeMin: start.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(maxResults),
    }),
  );
}

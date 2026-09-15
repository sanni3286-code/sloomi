import { create } from 'zustand';
import { fetchTodaysEvents, fetchUpcomingEvents, requestAccessToken, type CalendarEvent } from '../lib/googleCalendar';
import { useSettingsStore } from './settingsStore';

interface CalendarState {
  accessToken: string | null;
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  /** true, wenn zuvor verbunden, die stille Reauthentifizierung beim Laden aber fehlschlug. */
  needsReconnect: boolean;
  error: string | null;

  connect: () => Promise<void>;
  disconnect: () => void;
  trySilentReconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  accessToken: null,
  events: [],
  upcomingEvents: [],
  loading: false,
  needsReconnect: false,
  error: null,

  connect: async () => {
    set({ loading: true, error: null });
    try {
      const token = await requestAccessToken(false);
      set({ accessToken: token, needsReconnect: false });
      await useSettingsStore.getState().update({ googleCalendarConnected: true });
      await get().refresh();
    } catch {
      set({ loading: false, error: 'Verbindung mit Google Kalender fehlgeschlagen.' });
    }
  },

  disconnect: () => {
    set({ accessToken: null, events: [], upcomingEvents: [], needsReconnect: false, error: null });
    void useSettingsStore.getState().update({ googleCalendarConnected: false });
  },

  trySilentReconnect: async () => {
    const wasConnected = useSettingsStore.getState().settings.googleCalendarConnected;
    if (!wasConnected) return;
    set({ loading: true });
    try {
      const token = await requestAccessToken(true);
      set({ accessToken: token, needsReconnect: false });
      await get().refresh();
    } catch {
      set({ loading: false, needsReconnect: true });
    }
  },

  refresh: async () => {
    const token = get().accessToken;
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const [events, upcomingEvents] = await Promise.all([
        fetchTodaysEvents(token),
        fetchUpcomingEvents(token),
      ]);
      set({ events, upcomingEvents, loading: false });
    } catch (err) {
      if (err instanceof Error && err.message === 'unauthorized') {
        set({ accessToken: null, loading: false, needsReconnect: true });
      } else {
        set({ loading: false, error: 'Termine konnten nicht geladen werden.' });
      }
    }
  },
}));

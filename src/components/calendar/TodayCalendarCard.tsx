import { useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { formatClock } from '../../lib/format';

/**
 * Rein informative Anzeige der heutigen Google-Kalender-Termine zur zeitlichen
 * Orientierung — keine Bearbeitung, keine Kalenderansicht (Spec §48).
 */
export function TodayCalendarCard() {
  const { events, loading, needsReconnect, error, trySilentReconnect } = useCalendarStore();

  useEffect(() => {
    void trySilentReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (needsReconnect) {
    return (
      <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 mb-3 flex items-center justify-between gap-3">
        <span className="text-[13px] text-[var(--color-text-muted)]">Kalender-Sitzung abgelaufen.</span>
        <button
          onClick={() => void trySilentReconnect()}
          className="text-[13px] font-medium text-[var(--color-on-accent)] shrink-0"
        >
          Erneut verbinden
        </button>
      </div>
    );
  }

  if (error) return null;
  if (!loading && events.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays size={15} className="text-[var(--color-text-faint)]" />
        <h2 className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
          Termine heute
        </h2>
      </div>
      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)]">Lädt…</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {events.map((event) => (
            <li key={event.id} className="flex items-baseline gap-2 text-[14px]">
              <span className="tabular-nums text-[var(--color-text-muted)] shrink-0 w-12">
                {event.allDay ? 'ganztägig' : formatClock(event.start)}
              </span>
              <span className="text-[var(--color-text)] truncate">{event.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

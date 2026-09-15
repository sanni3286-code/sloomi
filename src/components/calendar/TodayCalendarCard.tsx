import { useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { formatClock } from '../../lib/format';
import type { CalendarEvent } from '../../lib/googleCalendar';

/**
 * Rein informative Anzeige der Google-Kalender-Termine zur zeitlichen
 * Orientierung — keine Bearbeitung, keine Kalenderansicht (Spec §48).
 */
export function TodayCalendarCard() {
  const { events, upcomingEvents, loading, needsReconnect, error, trySilentReconnect } = useCalendarStore();

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

  const today = new Date();
  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(today);
  const dayNumber = today.getDate();
  const groups = groupByDay(upcomingEvents);

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={15} className="text-[var(--color-text-faint)]" />
        <h2 className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
          Kalender
        </h2>
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)]">Lädt…</p>
      ) : (
        <div className="flex gap-4">
          <div className="w-[84px] shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              {weekday}
            </div>
            <div className="text-[36px] font-bold leading-none text-[var(--color-text)] mt-0.5">{dayNumber}</div>
            {events.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-muted)] mt-2 leading-snug">Heute keine Termine</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {events.map((event) => (
                  <li key={event.id} className="text-[12px] leading-snug">
                    <span className="block font-medium text-[var(--color-text)] truncate">{event.title}</span>
                    {!event.allDay && (
                      <span className="block tabular-nums text-[var(--color-text-muted)]">
                        {formatClock(event.start)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="w-px bg-[var(--color-border)] self-stretch" />

          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {groups.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Keine weiteren Termine.</p>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-faint)] mb-1">
                    {group.label}
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg pl-2 pr-2.5 py-1.5 border-l-[3px]"
                        style={{ background: 'var(--color-accent-soft)', borderColor: 'var(--color-accent)' }}
                      >
                        <div className="text-[13px] font-medium text-[var(--color-text)] truncate">
                          {event.title}
                        </div>
                        {!event.allDay && (
                          <div className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                            {formatClock(event.start)} – {formatClock(event.end)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function groupByDay(events: CalendarEvent[]): { key: string; label: string; events: CalendarEvent[] }[] {
  const groups: { key: string; label: string; events: CalendarEvent[] }[] = [];
  for (const event of events) {
    const key = event.start.toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.events.push(event);
    } else {
      const label = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'short' })
        .format(event.start)
        .toUpperCase();
      groups.push({ key, label, events: [event] });
    }
  }
  return groups;
}

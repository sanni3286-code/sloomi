import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';
import { TodayCalendarCard } from '../components/calendar/TodayCalendarCard';
import { TaskPlanningPage } from './TaskPlanningPage';
import { getOrderedTasks } from '../lib/selectors';
import { computePlanningSchedule, compareToTarget, sumDurations } from '../lib/scheduleEngine';
import { formatClock, formatDurationLong } from '../lib/format';
import { Sloth } from '../components/sloth/Sloth';
import { Button } from '../components/common/Button';
import { BottomSheet } from '../components/common/BottomSheet';
import { unlockAudio } from '../lib/sound';
import { publicUrl } from '../lib/publicUrl';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Hallo';
  return 'Guten Abend';
}

export function TodayPage() {
  const tasks = useSessionStore((s) => s.tasks);
  const startSession = useSessionStore((s) => s.startSession);
  const setTargetTime = useSessionStore((s) => s.setTargetTime);
  const session = useSessionStore((s) => s.session);
  const googleCalendarConnected = useSettingsStore((s) => s.settings.googleCalendarConnected);

  const [planningOpen, setPlanningOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const ordered = useMemo(() => getOrderedTasks(tasks), [tasks]);
  const now = new Date();
  const schedule = useMemo(() => computePlanningSchedule(now, ordered), [ordered]);
  const total = sumDurations(ordered);
  const targetDelta = session?.targetTime ? compareToTarget(schedule.finishAt, new Date(session.targetTime)) : null;

  if (planningOpen) {
    return <TaskPlanningPage onBack={() => setPlanningOpen(false)} />;
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-5 pt-6 safe-top flex flex-col items-center text-center gap-2">
        <img src={publicUrl('logo.png')} alt="sloomi" className="w-full max-w-[280px] mb-14" />
        <Sloth state={ordered.length === 0 ? 'idle' : 'planning'} size={230} className="mt-20" />
        <h1 className="text-[26px] font-semibold text-[var(--color-text)]">{greeting()}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)]">Was steht heute an?</p>
      </div>

      <div className="px-5 mt-6 flex-1">
        {googleCalendarConnected && <TodayCalendarCard />}

        <button
          onClick={() => setPlanningOpen(true)}
          className="w-full py-3.5 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Aufgaben planen
        </button>

        {ordered.length > 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-2">
            {ordered.length} Aufgaben · {formatDurationLong(total)}
          </p>
        )}
      </div>

      {ordered.length > 0 && (
        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="rounded-3xl bg-[var(--color-surface)] shadow-[var(--shadow-card)] px-5 py-4 flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-[13px] text-[var(--color-text-muted)]">
              <span>Gesamt</span>
              <span className="font-medium text-[var(--color-text)]">{formatDurationLong(total)}</span>
            </div>
            <div className="w-full h-px bg-[var(--color-border)] my-3" />
            <span className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] font-medium">
              Wenn du jetzt startest — fertig gegen
            </span>
            <span className="text-[32px] font-semibold text-[var(--color-text)] tabular-nums mt-1">{formatClock(schedule.finishAt)}</span>

            <button
              className="text-[13px] text-[var(--color-text-muted)] mt-2 underline decoration-dotted"
              onClick={() => {
                setTargetInput(
                  session?.targetTime
                    ? new Date(session.targetTime).toTimeString().slice(0, 5)
                    : '',
                );
                setTargetOpen(true);
              }}
            >
              {session?.targetTime ? `Ziel ${formatClock(new Date(session.targetTime))}` : 'Zielzeit festlegen'}
            </button>
            {targetDelta && (
              <span className={`text-[13px] mt-1 ${targetDelta.isOverTarget ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
                🦥 {targetDelta.isOverTarget
                  ? `${Math.round(Math.abs(targetDelta.deltaSeconds) / 60)} Min. über deinem Zeitrahmen`
                  : `${Math.round(Math.abs(targetDelta.deltaSeconds) / 60)} Min. Puffer`}
              </span>
            )}

            <Button
              size="lg"
              className="w-full mt-4"
              onClick={() => {
                unlockAudio();
                void startSession();
              }}
            >
              Start
            </Button>
          </div>
        </div>
      )}

      <BottomSheet open={targetOpen} onClose={() => setTargetOpen(false)} title="Zielzeit">
        <div className="flex flex-col gap-4 pb-2">
          <input
            type="time"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="h-14 px-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[20px] text-center text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <div className="flex gap-3">
            {session?.targetTime && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  void setTargetTime(null);
                  setTargetOpen(false);
                }}
              >
                Entfernen
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => {
                if (!targetInput) {
                  setTargetOpen(false);
                  return;
                }
                const [h, m] = targetInput.split(':').map(Number);
                const date = new Date();
                date.setHours(h, m, 0, 0);
                if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);
                void setTargetTime(date);
                setTargetOpen(false);
              }}
            >
              Übernehmen
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

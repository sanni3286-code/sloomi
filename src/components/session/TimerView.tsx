import { useMemo, useState, type ReactNode } from 'react';
import { Check, Pause, Play, Plus, RotateCcw, SkipForward, Undo2, X } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useLiveSchedule } from '../../hooks/useLiveSchedule';
import { getActiveTaskIndex, getOrderedTasks } from '../../lib/selectors';
import { getRemainingSeconds } from '../../lib/timerEngine';
import { compareToTarget } from '../../lib/scheduleEngine';
import { formatClock, formatCountdown, formatDeltaMinutes, formatDurationLong } from '../../lib/format';
import { getIconComponent } from '../../lib/iconLibrary';
import { CircularProgress } from './CircularProgress';
import { Sloth } from '../sloth/Sloth';
import { motivationFor } from '../../lib/motivation';
import { TaskList, type TaskListItem } from '../tasks/TaskList';
import { TaskEditorSheet, type TaskEditorValue } from '../tasks/TaskEditorSheet';
import { Button } from '../common/Button';
import { BottomSheet } from '../common/BottomSheet';
import { unlockAudio } from '../../lib/sound';
import { publicUrl } from '../../lib/publicUrl';

export function TimerView() {
  const session = useSessionStore((s) => s.session)!;
  const tasksRaw = useSessionStore((s) => s.tasks);
  const now = useSessionStore((s) => s.now);
  const pauseCurrent = useSessionStore((s) => s.pauseCurrent);
  const resumeCurrent = useSessionStore((s) => s.resumeCurrent);
  const skipCurrent = useSessionStore((s) => s.skipCurrent);
  const completeCurrentEarly = useSessionStore((s) => s.completeCurrentEarly);
  const goBack = useSessionStore((s) => s.goBack);
  const resetCurrent = useSessionStore((s) => s.resetCurrent);
  const adjustCurrent = useSessionStore((s) => s.adjustCurrent);
  const startSpecificTask = useSessionStore((s) => s.startSpecificTask);
  const addTask = useSessionStore((s) => s.addTask);
  const removeTask = useSessionStore((s) => s.removeTask);
  const reorderUpcoming = useSessionStore((s) => s.reorderUpcoming);
  const cancelSession = useSessionStore((s) => s.cancelSession);
  const updateTask = useSessionStore((s) => s.updateTask);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const ordered = useMemo(() => getOrderedTasks(tasksRaw), [tasksRaw]);
  const activeIndex = getActiveTaskIndex(ordered);
  const active = activeIndex !== -1 ? ordered[activeIndex] : null;
  const schedule = useLiveSchedule();
  const nowDate = new Date(now);

  const usedColors = ordered.map((t) => t.color);

  if (!active) {
    return <CompletedView />;
  }

  const remaining = Math.max(0, getRemainingSeconds(active, nowDate));
  const progress = active.status === 'idle' ? 0 : 1 - remaining / active.durationSeconds;
  const isPaused = active.status === 'paused';
  const isIdle = active.status === 'idle';

  const finishAt = schedule.finishAt;
  const targetDelta = session.targetTime ? compareToTarget(finishAt, new Date(session.targetTime)) : null;
  const planDelta = session.originalExpectedEndAt
    ? Math.round((finishAt.getTime() - session.originalExpectedEndAt) / 1000)
    : 0;

  const items: TaskListItem[] = ordered.map((t) => {
    let status: TaskListItem['status'] = 'upcoming';
    if (t.status === 'completed') status = 'done';
    else if (t.status === 'skipped') status = 'skipped';
    else if (t.id === active.id) status = 'current';
    return {
      id: t.id,
      title: t.title,
      icon: t.icon,
      color: t.color,
      durationSeconds: t.durationSeconds,
      status,
      expectedTime:
        t.status === 'completed' && t.completedAt
          ? new Date(t.completedAt)
          : schedule.byId.get(t.id)?.expectedEnd,
      draggable: t.status === 'idle' && t.id !== active.id,
    };
  });

  const editingTask = editId ? ordered.find((t) => t.id === editId) ?? null : null;
  const ActiveIcon = getIconComponent(active.icon);

  return (
    <div className="flex flex-col flex-1 pb-6">
      <div className="flex items-center justify-end px-5 pt-4 safe-top">
        <button
          onClick={() => setConfirmEnd(true)}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"
          aria-label="Session beenden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center px-6 mt-48">
        <div className="relative" style={{ width: 264, height: 264, overflow: 'visible' }}>
          {!isIdle && !isPaused && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                width: 340,
                height: 380,
                left: '50%',
                top: '50%',
                transform: 'translate(-47%, -87%) rotate(10deg)',
                background: '#EBFBED',
                borderRadius: '50%',
              }}
            />
          )}
          {!isIdle && isPaused && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                width: 320,
                height: 340,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -112%) rotate(-10deg)',
                background: '#FBF3DE',
                borderRadius: '50%',
              }}
            />
          )}
          <CircularProgress
            progress={progress}
            color="#8CBD9D"
            size={264}
            strokeWidth={42}
            softGradient
            trackColor="#F4EFE5"
            centerFill="var(--color-bg)"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="h-12 w-12 rounded-2xl flex items-center justify-center mb-1" style={{ background: `${active.color}22` }}>
                <ActiveIcon size={24} color={active.color} />
              </span>
              <span className="text-[13px] font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">
                {active.title}
              </span>
              <span className="text-[44px] leading-none font-semibold tabular-nums text-[var(--color-text)]">
                {formatCountdown(isIdle ? active.durationSeconds : remaining)}
              </span>
            </div>
          </CircularProgress>

          {!isIdle && !isPaused && (
            <img
              src={publicUrl('sloth/running.png')}
              alt="Faultier begleitet den laufenden Timer"
              draggable={false}
              style={{
                position: 'absolute',
                width: 292,
                left: '50%',
                top: -134,
                transform: 'translateX(calc(-50% + 8px)) rotate(-1deg)',
                pointerEvents: 'none',
              }}
            />
          )}

          {!isIdle && isPaused && (
            <img
              src={publicUrl('sloth/paused.png')}
              alt="Faultier ruht am pausierten Timer"
              draggable={false}
              style={{
                position: 'absolute',
                width: 235,
                left: '50%',
                top: -215,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {!isIdle && isPaused && (
          <span className="mt-3 px-3 py-1 rounded-full bg-[var(--color-surface-raised)] text-[12px] font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">
            Pausiert
          </span>
        )}
        {!isIdle && !isPaused && (
          <p className="text-[13px] text-[var(--color-text-faint)] mt-3">{motivationFor(active.id)}</p>
        )}

        <div className="flex items-center gap-2 mt-6">
          <ControlButton icon={<Undo2 size={18} />} label="Zurück" onClick={() => void goBack()} />
          <ControlButton icon={<span className="text-[13px] font-semibold">−1</span>} label="−1 Min." onClick={() => void adjustCurrent(-60)} disabled={isIdle} />
          {isIdle ? (
            <Button size="lg" className="h-16 w-16 rounded-full p-0" onClick={() => void startSpecificTask(active.id)}>
              <Play size={24} fill="var(--color-on-accent)" />
            </Button>
          ) : isPaused ? (
            <Button
              size="lg"
              className="h-16 w-16 rounded-full p-0"
              onClick={() => {
                unlockAudio();
                void resumeCurrent();
              }}
            >
              <Play size={24} fill="var(--color-on-accent)" />
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="h-16 w-16 rounded-full p-0" onClick={() => void pauseCurrent()}>
              <Pause size={22} />
            </Button>
          )}
          <ControlButton icon={<span className="text-[13px] font-semibold">+1</span>} label="+1 Min." onClick={() => void adjustCurrent(60)} disabled={isIdle} />
          <ControlButton icon={<Check size={18} />} label="Als erledigt markieren" onClick={() => void completeCurrentEarly()} disabled={isIdle} />
          <ControlButton icon={<SkipForward size={18} />} label="Überspringen" onClick={() => void skipCurrent()} />
        </div>
        <button
          onClick={() => void resetCurrent()}
          className="flex items-center gap-1 mt-4 text-[13px] text-[var(--color-text-faint)]"
        >
          <RotateCcw size={13} /> Zurücksetzen
        </button>
      </div>

      <div className="mt-8 mx-5 rounded-3xl bg-[var(--color-surface)] shadow-[var(--shadow-card)] px-5 py-4 flex flex-col items-center">
        <span className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] font-medium">
          Voraussichtlich fertig
        </span>
        <span className="text-[28px] font-semibold text-[var(--color-text)] tabular-nums mt-1">{formatClock(finishAt)}</span>
        {planDelta !== 0 && (
          <span className="text-[13px] text-[var(--color-text-muted)] mt-1">{formatDeltaMinutes(planDelta)} zum Plan</span>
        )}
        {targetDelta && (
          <span className={`text-[13px] mt-1 ${targetDelta.isOverTarget ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
            🦥 {targetDelta.isOverTarget
              ? `Dein Plan endet etwa ${Math.round(Math.abs(targetDelta.deltaSeconds) / 60)} Min. später als dein Ziel`
              : `${Math.round(Math.abs(targetDelta.deltaSeconds) / 60)} Min. Puffer bis ${formatClock(new Date(session.targetTime!))}`}
          </span>
        )}
      </div>

      <div className="mt-6 px-5 flex-1">
        <TaskList
          items={items}
          onReorderDraggable={(ids) => void reorderUpcoming(ids)}
          onTapItem={(id) => setEditId(id)}
          onDeleteItem={(id) => void removeTask(id)}
          deleteLabel="Heute überspringen"
          allowDelete={(item) => item.status === 'upcoming'}
        />

        <button
          onClick={() => setAddOpen(true)}
          className="w-full mt-3 py-3 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Aufgabe hinzufügen
        </button>
      </div>

      <TaskEditorSheet
        open={addOpen}
        mode="create"
        usedColors={usedColors}
        onClose={() => setAddOpen(false)}
        onSave={(value) => void addTask(value)}
      />

      {editingTask && (
        <TaskEditorSheet
          open={Boolean(editingTask)}
          mode="edit"
          usedColors={usedColors}
          initial={editingTask as TaskEditorValue}
          onClose={() => setEditId(null)}
          onSave={(value) => void updateTask(editingTask.id, value)}
          onDelete={editingTask.status === 'idle' ? () => { void removeTask(editingTask.id); setEditId(null); } : undefined}
        />
      )}

      <BottomSheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title="Session beenden?">
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">
          Der laufende Ablauf wird beendet. Dein gespeicherter Plan bleibt unverändert.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmEnd(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" className="flex-1 border border-red-200" onClick={() => void cancelSession()}>
            Beenden
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-11 w-11 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] active:scale-95 transition-transform disabled:opacity-30"
    >
      {icon}
    </button>
  );
}

function CompletedView() {
  const finishAndStartNewDay = useSessionStore((s) => s.finishAndStartNewDay);
  const session = useSessionStore((s) => s.session);
  const tasks = useSessionStore((s) => s.tasks);
  const doneCount = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.reduce((acc, t) => (t.status !== 'skipped' ? acc + t.durationSeconds : acc), 0);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-4">
      <Sloth state="completed" size={270} />
      <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Für heute durch.</h1>
      <p className="text-[14px] text-[var(--color-text-muted)]">
        {doneCount} Aufgabe{doneCount === 1 ? '' : 'n'} erledigt · {formatDurationLong(total)}
        {session?.startedAt && ` · Start um ${formatClock(new Date(session.startedAt))}`}
      </p>
      <Button size="lg" onClick={() => void finishAndStartNewDay()}>
        Neuen Ablauf planen
      </Button>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { usePlansStore } from '../store/plansStore';
import { getOrderedTasks } from '../lib/selectors';
import { computePlanningSchedule, compareToTarget, sumDurations } from '../lib/scheduleEngine';
import { formatClock, formatDurationLong } from '../lib/format';
import { Sloth } from '../components/sloth/Sloth';
import { TaskList, type TaskListItem } from '../components/tasks/TaskList';
import { TaskEditorSheet, type TaskEditorValue } from '../components/tasks/TaskEditorSheet';
import { Button } from '../components/common/Button';
import { BottomSheet } from '../components/common/BottomSheet';
import { getIconComponent } from '../lib/iconLibrary';
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
  const addTask = useSessionStore((s) => s.addTask);
  const updateTask = useSessionStore((s) => s.updateTask);
  const removeTask = useSessionStore((s) => s.removeTask);
  const reorderUpcoming = useSessionStore((s) => s.reorderUpcoming);
  const startSession = useSessionStore((s) => s.startSession);
  const setTargetTime = useSessionStore((s) => s.setTargetTime);
  const session = useSessionStore((s) => s.session);
  const plans = usePlansStore((s) => s.plans);
  const templates = usePlansStore((s) => s.templates);
  const addTemplatesToDraft = useSessionStore((s) => s.addTemplatesToDraft);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const ordered = useMemo(() => getOrderedTasks(tasks), [tasks]);
  const now = new Date();
  const schedule = useMemo(() => computePlanningSchedule(now, ordered), [ordered]);
  const total = sumDurations(ordered);
  const targetDelta = session?.targetTime ? compareToTarget(schedule.finishAt, new Date(session.targetTime)) : null;
  const usedColors = ordered.map((t) => t.color);

  const items: TaskListItem[] = ordered.map((t) => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
    color: t.color,
    durationSeconds: t.durationSeconds,
    status: 'upcoming',
    expectedTime: schedule.byId.get(t.id)?.expectedEnd,
    draggable: true,
  }));

  const editingTask = editId ? ordered.find((t) => t.id === editId) ?? null : null;

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-5 pt-6 safe-top flex flex-col items-center text-center gap-2">
        <img src={publicUrl('logo.png')} alt="sloomi" className="w-full max-w-[280px] mb-14" />
        <Sloth state={ordered.length === 0 ? 'idle' : 'planning'} size={150} className="mt-10" />
        <h1 className="text-[26px] font-semibold text-[var(--color-text)]">{greeting()}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)]">Was steht heute an?</p>
      </div>

      <div className="px-5 mt-6 flex-1">
        {ordered.length > 0 && (
          <TaskList
            items={items}
            onReorderDraggable={(ids) => void reorderUpcoming(ids)}
            onTapItem={(id) => setEditId(id)}
            onDeleteItem={(id) => void removeTask(id)}
            allowDelete={() => true}
          />
        )}

        <button
          onClick={() => setAddOpen(true)}
          className="w-full mt-3 py-3.5 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Aufgabe hinzufügen
        </button>

        {plans.length > 0 && (
          <button
            onClick={() => setPlanPickerOpen(true)}
            className="w-full mt-2 py-3 text-[14px] font-medium text-[var(--color-on-accent)]"
          >
            Gespeicherten Plan hinzufügen
          </button>
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
          onDelete={() => {
            void removeTask(editingTask.id);
            setEditId(null);
          }}
        />
      )}

      <BottomSheet open={planPickerOpen} onClose={() => setPlanPickerOpen(false)} title="Plan hinzufügen">
        <div className="flex flex-col gap-2 pb-2">
          {plans.map((plan) => {
            const list = templates[plan.id] ?? [];
            const Icon = getIconComponent(plan.icon ?? 'ListTodo');
            const duration = sumDurations(list);
            return (
              <button
                key={plan.id}
                onClick={() => {
                  void addTemplatesToDraft(plan.id, list);
                  setPlanPickerOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface-raised)] text-left"
              >
                <span className="h-11 w-11 rounded-2xl flex items-center justify-center bg-[var(--color-accent-soft)]">
                  <Icon size={20} color="var(--color-accent)" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-[var(--color-text)]">{plan.name}</span>
                  <span className="block text-[13px] text-[var(--color-text-muted)]">
                    {list.length} Aufgaben · {formatDurationLong(duration)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

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

import { useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { usePlansStore } from '../store/plansStore';
import { getOrderedTasks } from '../lib/selectors';
import { computePlanningSchedule, sumDurations } from '../lib/scheduleEngine';
import { formatDurationLong } from '../lib/format';
import { getIconComponent } from '../lib/iconLibrary';
import { TaskList, type TaskListItem } from '../components/tasks/TaskList';
import { TaskEditorSheet, type TaskEditorValue } from '../components/tasks/TaskEditorSheet';
import { BottomSheet } from '../components/common/BottomSheet';

interface TaskPlanningPageProps {
  onBack: () => void;
}

export function TaskPlanningPage({ onBack }: TaskPlanningPageProps) {
  const tasks = useSessionStore((s) => s.tasks);
  const addTask = useSessionStore((s) => s.addTask);
  const updateTask = useSessionStore((s) => s.updateTask);
  const removeTask = useSessionStore((s) => s.removeTask);
  const reorderUpcoming = useSessionStore((s) => s.reorderUpcoming);
  const addTemplatesToDraft = useSessionStore((s) => s.addTemplatesToDraft);
  const plans = usePlansStore((s) => s.plans);
  const templates = usePlansStore((s) => s.templates);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);

  const ordered = useMemo(() => getOrderedTasks(tasks), [tasks]);
  const schedule = useMemo(() => computePlanningSchedule(new Date(), ordered), [ordered]);
  const total = sumDurations(ordered);
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
      <div className="flex items-center px-5 pt-4 safe-top">
        <button
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text)]"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 px-5 mt-2 text-center">
        <h1 className="text-[20px] font-semibold text-[var(--color-text)]">Aufgabenplanung</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {ordered.length} Aufgaben · {formatDurationLong(total)}
        </p>
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
    </div>
  );
}

import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, MoreVertical, Play, Plus, Trash2 } from 'lucide-react';
import { usePlansStore } from '../store/plansStore';
import { useSessionStore } from '../store/sessionStore';
import { computePlanningSchedule, sumDurations } from '../lib/scheduleEngine';
import { formatDurationLong } from '../lib/format';
import { getIconComponent } from '../lib/iconLibrary';
import { TaskList, type TaskListItem } from '../components/tasks/TaskList';
import { TaskEditorSheet, type TaskEditorValue } from '../components/tasks/TaskEditorSheet';
import { IconPicker } from '../components/tasks/IconPicker';
import { PlanPreviewSheet } from '../components/plans/PlanPreviewSheet';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';

interface PlanEditorPageProps {
  planId: string;
  onBack: () => void;
  onStarted: () => void;
}

export function PlanEditorPage({ planId, onBack, onStarted }: PlanEditorPageProps) {
  const plan = usePlansStore((s) => s.plans.find((p) => p.id === planId));
  const templates = usePlansStore((s) => s.templates[planId] ?? []);
  const addTemplate = usePlansStore((s) => s.addTemplate);
  const updateTemplate = usePlansStore((s) => s.updateTemplate);
  const removeTemplate = usePlansStore((s) => s.removeTemplate);
  const reorderTemplates = usePlansStore((s) => s.reorderTemplates);
  const renamePlan = usePlansStore((s) => s.renamePlan);
  const duplicatePlan = usePlansStore((s) => s.duplicatePlan);
  const deletePlan = usePlansStore((s) => s.deletePlan);
  const setRepeat = usePlansStore((s) => s.setRepeat);
  const addTemplatesToDraft = useSessionStore((s) => s.addTemplatesToDraft);
  const startSession = useSessionStore((s) => s.startSession);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(plan?.name ?? '');

  const usedColors = templates.map((t) => t.color);
  const total = sumDurations(templates);
  const schedule = useMemo(() => computePlanningSchedule(new Date(), templates), [templates]);

  if (!plan) return null;
  const Icon = getIconComponent(plan.icon ?? 'ListTodo');

  const items: TaskListItem[] = templates.map((t) => ({
    id: t.id,
    title: t.title,
    icon: t.icon,
    color: t.color,
    durationSeconds: t.durationSeconds,
    status: 'upcoming',
    expectedTime: schedule.byId.get(t.id)?.expectedEnd,
    draggable: true,
  }));

  const editingTemplate = editId ? templates.find((t) => t.id === editId) ?? null : null;

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="flex items-center justify-between px-5 pt-4 safe-top">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text)]">
          <ArrowLeft size={18} />
        </button>
        <button onClick={() => setMenuOpen(true)} className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text)]">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 px-5 mt-2">
        <button onClick={() => setIconPickerOpen(true)} className="h-16 w-16 rounded-2xl flex items-center justify-center bg-[var(--color-accent-soft)]">
          <Icon size={28} color="var(--color-accent)" />
        </button>
        {renaming ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => {
              setRenaming(false);
              if (nameInput.trim()) void renamePlan(planId, nameInput.trim(), plan.icon);
            }}
            className="text-[20px] font-semibold text-center bg-transparent border-b border-[var(--color-border)] outline-none text-[var(--color-text)]"
          />
        ) : (
          <h1 className="text-[20px] font-semibold text-[var(--color-text)]" onClick={() => setRenaming(true)}>
            {plan.name}
          </h1>
        )}
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {templates.length} Aufgaben · {formatDurationLong(total)}
        </p>
      </div>

      <div className="px-5 mt-6 flex-1">
        {templates.length > 0 && (
          <TaskList
            items={items}
            onReorderDraggable={(ids) => void reorderTemplates(planId, ids)}
            onTapItem={(id) => setEditId(id)}
            onDeleteItem={(id) => void removeTemplate(id)}
            allowDelete={() => true}
          />
        )}
        <button
          onClick={() => setAddOpen(true)}
          className="w-full mt-3 py-3.5 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Aufgabe hinzufügen
        </button>
      </div>

      {templates.length > 0 && (
        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <Button size="lg" className="w-full flex items-center justify-center gap-2" onClick={() => setPreviewOpen(true)}>
            <Play size={18} fill="var(--color-on-accent)" /> Plan starten
          </Button>
        </div>
      )}

      <TaskEditorSheet
        open={addOpen}
        mode="create"
        usedColors={usedColors}
        onClose={() => setAddOpen(false)}
        onSave={(value) => void addTemplate(planId, value)}
      />

      {editingTemplate && (
        <TaskEditorSheet
          open={Boolean(editingTemplate)}
          mode="edit"
          usedColors={usedColors}
          initial={editingTemplate as TaskEditorValue}
          onClose={() => setEditId(null)}
          onSave={(value) => void updateTemplate(editingTemplate.id, value)}
          onDelete={() => {
            void removeTemplate(editingTemplate.id);
            setEditId(null);
          }}
        />
      )}

      <IconPicker
        open={iconPickerOpen}
        value={plan.icon ?? 'ListTodo'}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(icon) => void renamePlan(planId, plan.name, icon)}
      />

      <PlanPreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        planName={plan.name}
        planIcon={plan.icon}
        templates={templates}
        onStart={() => {
          void (async () => {
            await addTemplatesToDraft(planId, templates);
            await startSession();
            setPreviewOpen(false);
            onStarted();
          })();
        }}
      />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={plan.name}>
        <div className="flex flex-col gap-1 pb-2">
          <label className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
            <span className="text-[15px] text-[var(--color-text)]">Plan wiederholen</span>
            <input
              type="checkbox"
              checked={plan.repeat}
              onChange={(e) => void setRepeat(planId, e.target.checked)}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
          </label>
          <button
            className="flex items-center gap-3 py-3 text-[15px] text-[var(--color-text)]"
            onClick={() => {
              void duplicatePlan(planId, `${plan.name} (Kopie)`);
              setMenuOpen(false);
            }}
          >
            <Copy size={18} /> Plan duplizieren
          </button>
          <button
            className="flex items-center gap-3 py-3 text-[15px] text-red-500"
            onClick={() => {
              void deletePlan(planId);
              setMenuOpen(false);
              onBack();
            }}
          >
            <Trash2 size={18} /> Plan löschen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { Stepper } from '../common/Stepper';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { Button } from '../common/Button';
import { getIconComponent } from '../../lib/iconLibrary';
import { usePreferencesStore } from '../../store/preferencesStore';
import { recordIconUsage } from '../../lib/iconUsage';
import { DEFAULT_TASK_COLOR } from '../../lib/colorPalette';
import { DEFAULT_TASK_DURATION_SECONDS } from '../../types/models';
import type { Weekday } from '../../types/models';
import { WEEKDAY_SHORT_LABELS, WEEKDAYS } from '../../lib/weekday';
import type { TodoInput } from '../../store/todosStore';

interface TodoEditorSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: TodoInput;
  usedColors: string[];
  onClose: () => void;
  onSave: (value: TodoInput) => void;
  onDelete?: () => void;
}

const EMPTY: TodoInput = {
  title: '',
  durationSeconds: DEFAULT_TASK_DURATION_SECONDS,
  color: DEFAULT_TASK_COLOR,
  icon: 'ListTodo',
  weekday: null,
};

export function TodoEditorSheet({ open, mode, initial, usedColors, onClose, onSave, onDelete }: TodoEditorSheetProps) {
  const suggestFor = usePreferencesStore((s) => s.suggestFor);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [durationSeconds, setDurationSeconds] = useState(initial?.durationSeconds ?? EMPTY.durationSeconds);
  const [color, setColor] = useState(initial?.color ?? EMPTY.color);
  const [icon, setIcon] = useState(initial?.icon ?? EMPTY.icon);
  const [weekday, setWeekday] = useState<Weekday | null>(initial?.weekday ?? null);
  const [iconTouched, setIconTouched] = useState(mode === 'edit');
  const [colorTouched, setColorTouched] = useState(mode === 'edit');
  const [durationTouched, setDurationTouched] = useState(mode === 'edit');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDurationSeconds(initial?.durationSeconds ?? EMPTY.durationSeconds);
    setColor(initial?.color ?? EMPTY.color);
    setIcon(initial?.icon ?? EMPTY.icon);
    setWeekday(initial?.weekday ?? null);
    setIconTouched(mode === 'edit');
    setColorTouched(mode === 'edit');
    setDurationTouched(mode === 'edit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.title]);

  function handleTitleChange(next: string) {
    setTitle(next);
    if (mode !== 'create') return;
    if (!next.trim()) return;
    const suggestion = suggestFor(next, usedColors);
    if (!iconTouched) setIcon(suggestion.icon);
    if (!colorTouched) setColor(suggestion.color);
    if (!durationTouched) setDurationSeconds(suggestion.durationSeconds);
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const value: TodoInput = { title: trimmed, durationSeconds, color, icon, weekday };
    recordIconUsage(icon);
    void usePreferencesStore.getState().recordUsage(trimmed, {
      icon,
      color,
      durationSeconds,
      iconManuallySet: iconTouched,
    });
    onSave(value);
    onClose();
  }

  const Icon = getIconComponent(icon);

  return (
    <>
      <BottomSheet open={open && !pickerOpen} onClose={onClose} title={mode === 'create' ? 'Neues To-Do' : 'To-Do bearbeiten'}>
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center"
              style={{ background: `${color}22` }}
              aria-label="Icon ändern"
            >
              <Icon size={26} color={color} />
            </button>
            <input
              autoFocus={mode === 'create'}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Was steht an?"
              className="flex-1 h-14 px-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[17px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-3 text-center">Wochentag (optional)</h3>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setWeekday(null)}
                className="h-9 px-3 rounded-full text-[13px] font-medium border"
                style={{
                  background: weekday === null ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                  color: weekday === null ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
                  borderColor: weekday === null ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                Kein Tag
              </button>
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setWeekday(day)}
                  className="h-9 w-9 rounded-full text-[13px] font-medium border"
                  style={{
                    background: weekday === day ? 'var(--color-accent)' : 'var(--color-surface-raised)',
                    color: weekday === day ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
                    borderColor: weekday === day ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                >
                  {WEEKDAY_SHORT_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-3 text-center">Dauer</h3>
            <Stepper
              minutes={Math.round(durationSeconds / 60)}
              onChange={(m) => {
                setDurationTouched(true);
                setDurationSeconds(m * 60);
              }}
            />
          </div>

          <div>
            <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-3 text-center">Farbe</h3>
            <ColorPicker
              value={color}
              onChange={(c) => {
                setColorTouched(true);
                setColor(c);
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {onDelete && (
              <Button variant="danger" size="lg" onClick={onDelete} aria-label="Löschen">
                <Trash2 size={18} />
              </Button>
            )}
            <Button size="lg" className="flex-1" onClick={handleSave} disabled={!title.trim()}>
              {mode === 'create' ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      <IconPicker
        open={pickerOpen}
        value={icon}
        onClose={() => setPickerOpen(false)}
        onSelect={(next) => {
          setIcon(next);
          setIconTouched(true);
        }}
      />
    </>
  );
}

import { useMemo, useState } from 'react';
import { Plus, CalendarPlus, Check } from 'lucide-react';
import { useTodosStore } from '../../store/todosStore';
import { useSessionStore } from '../../store/sessionStore';
import { getIconComponent } from '../../lib/iconLibrary';
import { formatDurationLong } from '../../lib/format';
import { WEEKDAY_LABELS, WEEKDAYS } from '../../lib/weekday';
import { TodoEditorSheet } from './TodoEditorSheet';
import type { TodoItem, Weekday } from '../../types/models';

export function TodoSection() {
  const todos = useTodosStore((s) => s.todos);
  const addTodo = useTodosStore((s) => s.addTodo);
  const updateTodo = useTodosStore((s) => s.updateTodo);
  const removeTodo = useTodosStore((s) => s.removeTodo);
  const toggleCompleted = useTodosStore((s) => s.toggleCompleted);
  const addTaskToToday = useSessionStore((s) => s.addTask);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const usedColors = todos.map((t) => t.color);
  const editing = editId ? todos.find((t) => t.id === editId) ?? null : null;

  const groups = useMemo(() => {
    const byWeekday = new Map<Weekday | null, TodoItem[]>();
    for (const t of todos) {
      const list = byWeekday.get(t.weekday) ?? [];
      list.push(t);
      byWeekday.set(t.weekday, list);
    }
    const ordered: { key: Weekday | null; label: string; items: TodoItem[] }[] = [];
    for (const day of WEEKDAYS) {
      const items = byWeekday.get(day);
      if (items?.length) ordered.push({ key: day, label: WEEKDAY_LABELS[day], items });
    }
    const unassigned = byWeekday.get(null);
    if (unassigned?.length) ordered.push({ key: null, label: 'Ohne Tag', items: unassigned });
    return ordered;
  }, [todos]);

  return (
    <div className="flex flex-col gap-4">
      {groups.length === 0 && (
        <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-6">Noch keine To-Dos.</p>
      )}

      {groups.map((group) => (
        <div key={group.key ?? 'none'}>
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-faint)] mb-2 px-1">
            {group.label}
          </h3>
          <div className="flex flex-col gap-2">
            {group.items.map((todo) => {
              const Icon = getIconComponent(todo.icon);
              return (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface)]">
                  <button
                    onClick={() => void toggleCompleted(todo.id)}
                    className="h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: todo.color, background: todo.completed ? todo.color : 'transparent' }}
                    aria-label={todo.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
                  >
                    {todo.completed && <Check size={14} color="white" />}
                  </button>

                  <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setEditId(todo.id)}>
                    <span
                      className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
                      style={{ background: `${todo.color}22` }}
                    >
                      <Icon size={16} color={todo.color} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-[14px] font-medium truncate ${todo.completed ? 'line-through text-[var(--color-text-faint)]' : 'text-[var(--color-text)]'}`}
                      >
                        {todo.title}
                      </span>
                      <span className="block text-[12px] text-[var(--color-text-muted)]">{formatDurationLong(todo.durationSeconds)}</span>
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      void addTaskToToday({
                        title: todo.title,
                        durationSeconds: todo.durationSeconds,
                        color: todo.color,
                        icon: todo.icon,
                        sound: null,
                      })
                    }
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-[var(--color-accent-soft)]"
                    aria-label="Heute einplanen"
                  >
                    <CalendarPlus size={15} color="var(--color-accent)" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => setAddOpen(true)}
        className="w-full py-3.5 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
      >
        <Plus size={16} /> To-Do hinzufügen
      </button>

      <TodoEditorSheet open={addOpen} mode="create" usedColors={usedColors} onClose={() => setAddOpen(false)} onSave={(value) => void addTodo(value)} />

      {editing && (
        <TodoEditorSheet
          open={Boolean(editing)}
          mode="edit"
          usedColors={usedColors}
          initial={editing}
          onClose={() => setEditId(null)}
          onSave={(value) => void updateTodo(editing.id, value)}
          onDelete={() => {
            void removeTodo(editing.id);
            setEditId(null);
          }}
        />
      )}
    </div>
  );
}

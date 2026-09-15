import { Trash2 } from 'lucide-react';
import { getIconComponent } from '../../lib/iconLibrary';
import { formatDurationLong } from '../../lib/format';

interface PlanCardProps {
  name: string;
  icon: string | null;
  taskCount: number;
  totalSeconds: number;
  onTap: () => void;
  onDelete: () => void;
}

export function PlanCard({ name, icon, taskCount, totalSeconds, onTap, onDelete }: PlanCardProps) {
  const Icon = getIconComponent(icon ?? 'ListTodo');
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <button onClick={onTap} className="flex items-center gap-3 p-4 flex-1 min-w-0 text-left">
        <span className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--color-accent-soft)] shrink-0">
          <Icon size={22} color="var(--color-accent)" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium text-[var(--color-text)] truncate">{name}</span>
          <span className="block text-[13px] text-[var(--color-text-muted)]">
            {taskCount} Aufgabe{taskCount === 1 ? '' : 'n'} · {formatDurationLong(totalSeconds)}
          </span>
        </span>
      </button>
      <button
        onClick={onDelete}
        aria-label="Plan löschen"
        className="h-9 w-9 mr-3 shrink-0 flex items-center justify-center rounded-full text-[var(--color-text-faint)]"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

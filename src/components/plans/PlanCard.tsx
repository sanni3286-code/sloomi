import { getIconComponent } from '../../lib/iconLibrary';
import { formatDurationLong } from '../../lib/format';

interface PlanCardProps {
  name: string;
  icon: string | null;
  taskCount: number;
  totalSeconds: number;
  onTap: () => void;
}

export function PlanCard({ name, icon, taskCount, totalSeconds, onTap }: PlanCardProps) {
  const Icon = getIconComponent(icon ?? 'ListTodo');
  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-card)] text-left w-full"
    >
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
  );
}

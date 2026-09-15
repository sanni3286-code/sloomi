import type { ReactNode } from 'react';
import { Check, GripVertical, X } from 'lucide-react';
import { getIconComponent } from '../../lib/iconLibrary';
import { getContrastColor } from '../../lib/contrastColor';

export type RowStatusVariant = 'done' | 'current' | 'upcoming' | 'skipped';

interface TaskRowProps {
  title: string;
  icon: string;
  color: string;
  durationLabel: string;
  timeLabel?: string;
  status: RowStatusVariant;
  onTap?: () => void;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragHandleListeners?: Record<string, unknown>;
  trailing?: ReactNode;
}

export function TaskRow({
  title,
  icon,
  color,
  durationLabel,
  timeLabel,
  status,
  onTap,
  dragHandleRef,
  dragHandleListeners,
  trailing,
}: TaskRowProps) {
  const Icon = getIconComponent(icon);
  const dimmed = status === 'done' || status === 'skipped';

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 bg-[var(--color-surface)] rounded-2xl select-none"
      style={{ opacity: dimmed ? 0.55 : 1 }}
    >
      {dragHandleRef && (
        <button
          ref={dragHandleRef}
          {...dragHandleListeners}
          className="shrink-0 h-8 w-8 -ml-1 flex items-center justify-center text-[var(--color-text-faint)] touch-none cursor-grab active:cursor-grabbing"
          aria-label="Verschieben"
        >
          <GripVertical size={18} />
        </button>
      )}

      <button
        type="button"
        onClick={onTap}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <span
          className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center"
          style={{ background: status === 'current' ? color : `${color}1f` }}
        >
          {status === 'done' ? (
            <Check size={20} color={color} strokeWidth={3} />
          ) : status === 'skipped' ? (
            <X size={20} color="var(--color-text-faint)" strokeWidth={3} />
          ) : (
            <Icon size={20} color={status === 'current' ? getContrastColor(color) : color} />
          )}
        </span>

        <span className="flex-1 min-w-0">
          <span
            className="block text-[15px] font-medium text-[var(--color-text)] truncate"
            style={{ textDecoration: status === 'skipped' ? 'line-through' : 'none' }}
          >
            {title}
          </span>
          <span className="block text-[13px] text-[var(--color-text-muted)]">{durationLabel}</span>
        </span>

        {timeLabel && (
          <span className="shrink-0 text-[14px] tabular-nums font-medium text-[var(--color-text-muted)]">{timeLabel}</span>
        )}
      </button>

      {trailing}
    </div>
  );
}

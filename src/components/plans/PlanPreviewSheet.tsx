import { useMemo } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { computePlanningSchedule, sumDurations } from '../../lib/scheduleEngine';
import { formatClock, formatDurationLong } from '../../lib/format';
import { getIconComponent } from '../../lib/iconLibrary';
import type { TaskTemplate } from '../../types/models';

interface PlanPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  planIcon: string | null;
  templates: TaskTemplate[];
  onStart: () => void;
}

export function PlanPreviewSheet({ open, onClose, planName, planIcon, templates, onStart }: PlanPreviewSheetProps) {
  const schedule = useMemo(() => computePlanningSchedule(new Date(), templates), [templates, open]);
  const total = sumDurations(templates);
  const Icon = getIconComponent(planIcon ?? 'ListTodo');

  return (
    <BottomSheet open={open} onClose={onClose} title={planName}>
      <div className="flex flex-col items-center gap-4 pb-2">
        <span className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[var(--color-accent-soft)]">
          <Icon size={26} color="var(--color-accent)" />
        </span>
        <p className="text-[14px] text-[var(--color-text-muted)]">
          {templates.length} Aufgaben · Gesamtdauer {formatDurationLong(total)}
        </p>

        <div className="w-full rounded-2xl bg-[var(--color-surface-raised)] px-5 py-4 flex flex-col items-center">
          <span className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] font-medium">
            Wenn du jetzt startest — fertig gegen
          </span>
          <span className="text-[28px] font-semibold text-[var(--color-text)] tabular-nums mt-1">{formatClock(schedule.finishAt)}</span>
        </div>

        <Button size="lg" className="w-full" onClick={onStart}>
          Start
        </Button>
      </div>
    </BottomSheet>
  );
}

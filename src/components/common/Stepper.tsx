import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  minutes: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/** Grobe Schritte per +/- Buttons, exakte Minutenwerte per Antippen der Zahl (Tastatureingabe). */
export function Stepper({ minutes, onChange, min = 1, max = 480, step = 5 }: StepperProps) {
  const [text, setText] = useState(String(minutes));

  useEffect(() => {
    setText(String(minutes));
  }, [minutes]);

  function commit(raw: string) {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setText(String(minutes));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
    setText(String(clamped));
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, minutes - step))}
        aria-label="Weniger Zeit"
        className="h-12 w-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center active:scale-95 transition-transform text-[var(--color-text)]"
      >
        <Minus size={20} />
      </button>
      <div className="min-w-[110px] flex items-baseline justify-center">
        <input
          type="number"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          aria-label="Dauer in Minuten (exakt eingeben)"
          className="w-16 text-3xl font-semibold tabular-nums text-[var(--color-text)] text-right bg-transparent outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-lg text-[var(--color-text-muted)] ml-1">Min.</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, minutes + step))}
        aria-label="Mehr Zeit"
        className="h-12 w-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center active:scale-95 transition-transform text-[var(--color-text)]"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}

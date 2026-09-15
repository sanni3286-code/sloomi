import { Check } from 'lucide-react';
import { TASK_COLORS } from '../../lib/colorPalette';
import { getContrastColor } from '../../lib/contrastColor';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {TASK_COLORS.map((c) => {
        const selected = c.value.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c.id}
            type="button"
            aria-label={c.label}
            onClick={() => onChange(c.value)}
            className="h-10 w-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ backgroundColor: c.value, boxShadow: selected ? `0 0 0 3px var(--color-surface), 0 0 0 5px ${c.value}` : 'none' }}
          >
            {selected && <Check size={18} color={getContrastColor(c.value)} strokeWidth={3} />}
          </button>
        );
      })}
      <label className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer border border-dashed border-[var(--color-border)] relative overflow-hidden text-[var(--color-text-muted)] text-xs">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <span style={{ background: value }} className="absolute inset-1 rounded-full" />
      </label>
    </div>
  );
}

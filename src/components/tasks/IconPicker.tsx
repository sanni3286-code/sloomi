import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { ICON_CATEGORIES, ALL_PICKER_ICONS, getIconComponent } from '../../lib/iconLibrary';
import { getFrequentIcons, getRecentIcons } from '../../lib/iconUsage';

interface IconPickerProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
}

function IconGrid({ icons, selected, onSelect }: { icons: string[]; selected: string; onSelect: (i: string) => void }) {
  if (icons.length === 0) return null;
  return (
    <div className="grid grid-cols-5 gap-2">
      {icons.map((iconName) => {
        const Icon = getIconComponent(iconName);
        const isSelected = iconName === selected;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelect(iconName)}
            className="aspect-square rounded-2xl flex items-center justify-center border transition-colors"
            style={{
              borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
              background: isSelected ? 'var(--color-accent-soft)' : 'var(--color-surface-raised)',
            }}
          >
            <Icon size={22} color={isSelected ? 'var(--color-accent)' : 'var(--color-text)'} />
          </button>
        );
      })}
    </div>
  );
}

export function IconPicker({ open, value, onClose, onSelect }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const recent = useMemo(() => getRecentIcons(), [open]);
  const frequent = useMemo(() => getFrequentIcons(), [open]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_PICKER_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  function handleSelect(icon: string) {
    onSelect(icon);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Icon wählen">
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Icon suchen…"
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[15px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {searchResults ? (
        <IconGrid icons={searchResults} selected={value} onSelect={handleSelect} />
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          {recent.length > 0 && (
            <section>
              <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">Zuletzt verwendet</h3>
              <IconGrid icons={recent} selected={value} onSelect={handleSelect} />
            </section>
          )}
          {frequent.length > 0 && (
            <section>
              <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">Häufig verwendet</h3>
              <IconGrid icons={frequent} selected={value} onSelect={handleSelect} />
            </section>
          )}
          {ICON_CATEGORIES.map((cat) => (
            <section key={cat.label}>
              <h3 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{cat.label}</h3>
              <IconGrid icons={cat.icons} selected={value} onSelect={handleSelect} />
            </section>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

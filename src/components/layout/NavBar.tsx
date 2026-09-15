import { CalendarDays, ListChecks, Settings } from 'lucide-react';

export type NavTab = 'today' | 'plans' | 'settings';

interface NavBarProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'today', label: 'Heute', icon: CalendarDays },
  { id: 'plans', label: 'Pläne', icon: ListChecks },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
];

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)] safe-bottom z-40">
      <div className="flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5"
            >
              <Icon size={22} color={isActive ? 'var(--color-on-accent)' : 'var(--color-text-faint)'} />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? 'var(--color-on-accent)' : 'var(--color-text-faint)' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

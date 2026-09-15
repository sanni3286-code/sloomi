import { Plus } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { TodayCalendarCard } from '../components/calendar/TodayCalendarCard';
import { Sloth } from '../components/sloth/Sloth';
import { publicUrl } from '../lib/publicUrl';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Hallo';
  return 'Guten Abend';
}

interface TodayPageProps {
  onPlanTasks: () => void;
}

export function TodayPage({ onPlanTasks }: TodayPageProps) {
  const googleCalendarConnected = useSettingsStore((s) => s.settings.googleCalendarConnected);

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-5 pt-6 safe-top flex flex-col items-center text-center gap-2">
        <img src={publicUrl('logo.png')} alt="sloomi" className="w-full max-w-[280px] mb-6" />
        <Sloth state="idle" size={230} className="mt-4" />
        <h1 className="text-[26px] font-semibold text-[var(--color-text)]">{greeting()}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)]">Was steht heute an?</p>
      </div>

      <div className="px-5 mt-6 flex-1">
        {googleCalendarConnected && <TodayCalendarCard />}

        <button
          onClick={onPlanTasks}
          className="w-full py-3.5 rounded-2xl border border-dashed border-[var(--color-accent)] text-[var(--color-on-accent)] bg-[var(--color-accent-soft)] text-[14px] font-medium flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Aufgaben planen
        </button>
      </div>
    </div>
  );
}

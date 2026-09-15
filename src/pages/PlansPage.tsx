import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePlansStore } from '../store/plansStore';
import { sumDurations } from '../lib/scheduleEngine';
import { PlanCard } from '../components/plans/PlanCard';
import { PlanEditorPage } from './PlanEditorPage';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';
import { Sloth } from '../components/sloth/Sloth';

export function PlansPage() {
  const plans = usePlansStore((s) => s.plans);
  const templates = usePlansStore((s) => s.templates);
  const createPlan = usePlansStore((s) => s.createPlan);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (selectedPlanId) {
    return (
      <PlanEditorPage
        planId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
        onStarted={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-5 pt-6 safe-top flex flex-col items-center text-center gap-2">
        <Sloth state="planning" size={120} />
        <h1 className="text-[20px] font-semibold text-[var(--color-text)]">Meine Pläne</h1>
        <p className="text-[14px] text-[var(--color-text-muted)]">Wiederkehrende Abläufe zum Wiederverwenden</p>
      </div>

      <div className="px-5 mt-5 flex-1 flex flex-col gap-2">
        {plans.map((plan) => {
          const list = templates[plan.id] ?? [];
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              icon={plan.icon}
              taskCount={list.length}
              totalSeconds={sumDurations(list)}
              onTap={() => setSelectedPlanId(plan.id)}
            />
          );
        })}

        <button
          onClick={() => {
            setNameInput('');
            setCreateOpen(true);
          }}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] text-[14px] font-medium mt-1"
        >
          <Plus size={16} /> Neuer Plan
        </button>
      </div>

      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title="Neuer Plan">
        <div className="flex flex-col gap-4 pb-2">
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="z.B. Morgenroutine"
            className="h-14 px-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[17px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <Button
            size="lg"
            disabled={!nameInput.trim()}
            onClick={() => {
              void (async () => {
                const plan = await createPlan(nameInput.trim(), null);
                setCreateOpen(false);
                setSelectedPlanId(plan.id);
              })();
            }}
          >
            Plan erstellen
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

import { useState } from 'react';
import { Sloth } from '../sloth/Sloth';
import { Button } from '../common/Button';
import { useSettingsStore } from '../../store/settingsStore';

const STEPS = [
  { title: 'Plane deinen Ablauf', text: 'Trage die Aufgaben ein, die heute anstehen — in der Reihenfolge, in der du sie erledigen willst.' },
  { title: 'Schätze die Dauer', text: 'Gib für jede Aufgabe an, wie lange du ungefähr brauchst. Mehr nicht.' },
  { title: 'Sieh, wann du fertig bist', text: 'FlowTime berechnet automatisch, wann jede Aufgabe dran ist — und wann alles erledigt ist.' },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const complete = useSettingsStore((s) => s.update);
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] px-8 safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <Sloth state={step === 2 ? 'completed' : 'planning'} size={100} />
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--color-text)] mb-2">{STEPS[step].title}</h1>
          <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed max-w-[320px]">{STEPS[step].text}</p>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === step ? 20 : 6, background: i === step ? 'var(--color-accent)' : 'var(--color-border)' }}
          />
        ))}
      </div>

      <Button size="lg" className="mb-8" onClick={() => (isLast ? void complete({ onboardingCompleted: true }) : setStep((s) => s + 1))}>
        {isLast ? 'Los geht’s' : 'Weiter'}
      </Button>
    </div>
  );
}

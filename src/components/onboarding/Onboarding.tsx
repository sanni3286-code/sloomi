import { useState } from 'react';
import { Sloth } from '../sloth/Sloth';
import { Button } from '../common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { publicUrl } from '../../lib/publicUrl';

const STEPS = [
  { title: 'Plane deinen Ablauf', text: 'Trage die Aufgaben ein, die heute anstehen — in der Reihenfolge, in der du sie erledigen willst.' },
  { title: 'Schätze die Dauer', text: 'Gib für jede Aufgabe an, wie lange du ungefähr brauchst. Mehr nicht.' },
  { title: 'Sieh, wann du fertig bist', text: 'sloomi berechnet automatisch, wann jede Aufgabe dran ist — und wann alles erledigt ist.' },
];

const TOTAL_STEPS = STEPS.length + 1;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const complete = useSettingsStore((s) => s.update);
  const isWelcome = step === 0;
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] px-8 safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        {isWelcome ? (
          <>
            <img src={publicUrl('logo.png')} alt="sloomi – your time. your pace." className="w-full max-w-[340px]" />
            <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed max-w-[320px]">
              Dein ruhiger Begleiter durch den Tag — plane, starte den Timer, sieh jederzeit, wann du fertig bist.
            </p>
          </>
        ) : (
          <>
            <Sloth state={step === TOTAL_STEPS - 1 ? 'completed' : 'planning'} size={100} />
            <div>
              <h1 className="text-[22px] font-semibold text-[var(--color-text)] mb-2">{STEPS[step - 1].title}</h1>
              <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed max-w-[320px]">{STEPS[step - 1].text}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === step ? 20 : 6, background: i === step ? 'var(--color-accent)' : 'var(--color-border)' }}
          />
        ))}
      </div>

      <Button size="lg" className="mb-8" onClick={() => (isLast ? void complete({ onboardingCompleted: true }) : setStep((s) => s + 1))}>
        {isWelcome ? 'Los geht’s' : isLast ? 'Fertig' : 'Weiter'}
      </Button>
    </div>
  );
}

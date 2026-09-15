import { useState, type ReactNode } from 'react';
import { Bell, Check, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { playSound, unlockAudio } from '../lib/sound';
import { isNotificationSupported, requestNotificationPermission } from '../lib/notifications';
import type { SoundId, ThemePreference } from '../types/models';

const SOUND_OPTIONS: { id: SoundId; label: string }[] = [
  { id: 'soft-bell', label: 'Soft Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'digital', label: 'Digital' },
  { id: 'wood', label: 'Wood' },
  { id: 'silent', label: 'Lautlos' },
];

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
  { id: 'system', label: 'System' },
];

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 bg-[var(--color-surface)] rounded-2xl">
      <div className="pr-3">
        <div className="text-[15px] text-[var(--color-text)]">{label}</div>
        {description && <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-12 h-7 rounded-full relative transition-colors shrink-0"
      style={{ background: checked ? 'var(--color-accent)' : 'var(--color-border)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>(
    isNotificationSupported() ? Notification.permission : 'unsupported',
  );

  return (
    <div className="flex flex-col flex-1 pb-24 px-5">
      <div className="pt-6 safe-top">
        <h1 className="text-[20px] font-semibold text-[var(--color-text)]">Einstellungen</h1>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] px-1">Darstellung</h2>
        <div className="flex bg-[var(--color-surface)] rounded-2xl p-1">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => void update({ theme: opt.id })}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors"
              style={{
                background: settings.theme === opt.id ? 'var(--color-accent)' : 'transparent',
                color: settings.theme === opt.id ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] px-1">Ablauf</h2>
        <Row label="Nächste Aufgabe automatisch starten" description="Bei Aus wirst du beim Aufgabenende gefragt.">
          <Toggle checked={settings.autoAdvance} onChange={(v) => void update({ autoAdvance: v })} />
        </Row>
        <Row label="Haptik" description="Dezentes Feedback bei Start, Pause & Abschluss.">
          <Toggle checked={settings.hapticsEnabled} onChange={(v) => void update({ hapticsEnabled: v })} />
        </Row>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] px-1">Standard-Sound</h2>
        <div className="flex flex-col gap-2">
          {SOUND_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                unlockAudio();
                playSound(opt.id);
                void update({ defaultSound: opt.id });
              }}
              className="flex items-center justify-between py-3.5 px-4 bg-[var(--color-surface)] rounded-2xl"
            >
              <span className="flex items-center gap-3 text-[15px] text-[var(--color-text)]">
                <Volume2 size={17} className="text-[var(--color-text-muted)]" />
                {opt.label}
              </span>
              {settings.defaultSound === opt.id && <Check size={18} color="var(--color-accent)" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 mb-6">
        <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] px-1">Benachrichtigungen</h2>
        <Row
          label="Push-Benachrichtigungen"
          description={
            notifStatus === 'unsupported'
              ? 'Auf diesem Gerät nicht verfügbar.'
              : notifStatus === 'granted'
                ? 'Aktiviert.'
                : 'Werden angezeigt, wenn die App im Hintergrund ist.'
          }
        >
          {notifStatus !== 'unsupported' && notifStatus !== 'granted' && (
            <button
              onClick={() => void requestNotificationPermission().then(setNotifStatus)}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-accent-soft)]"
              aria-label="Benachrichtigungen aktivieren"
            >
              <Bell size={16} color="var(--color-accent)" />
            </button>
          )}
          {notifStatus === 'granted' && <Check size={18} color="var(--color-accent)" />}
        </Row>
      </div>
    </div>
  );
}

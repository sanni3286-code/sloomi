import { useState, type ReactNode } from 'react';
import { Bell, Check, Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useCalendarStore } from '../store/calendarStore';
import { playSound, unlockAudio } from '../lib/sound';
import { isNotificationSupported, requestNotificationPermission } from '../lib/notifications';
import { Button } from '../components/common/Button';
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
  const connect = useCalendarStore((s) => s.connect);
  const disconnect = useCalendarStore((s) => s.disconnect);
  const calendarLoading = useCalendarStore((s) => s.loading);
  const calendarError = useCalendarStore((s) => s.error);

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

        <div className="flex items-center gap-3 py-3.5 px-4 bg-[var(--color-surface)] rounded-2xl">
          {settings.soundVolume === 0 ? (
            <VolumeX size={17} className="text-[var(--color-text-muted)] shrink-0" />
          ) : (
            <Volume2 size={17} className="text-[var(--color-text-muted)] shrink-0" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.soundVolume}
            onChange={(e) => void update({ soundVolume: Number(e.target.value) })}
            onPointerUp={() => {
              unlockAudio();
              playSound(settings.defaultSound);
            }}
            aria-label="Lautstärke der Benachrichtigungstöne"
            className="flex-1 accent-[var(--color-accent)]"
          />
          <span className="text-[13px] tabular-nums text-[var(--color-text-muted)] w-9 text-right shrink-0">
            {Math.round(settings.soundVolume * 100)}%
          </span>
        </div>

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
        <p className="text-[12px] text-[var(--color-text-faint)] px-1 leading-relaxed">
          Auf iPhones mit aktiviertem Stumm-Schalter bleiben Töne aus — das ist eine Systembeschränkung von
          iOS, die Web-Apps nicht umgehen können. Die Haptik (Vibration) funktioniert in diesem Fall weiterhin.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
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

      <div className="mt-6 flex flex-col gap-2 mb-6">
        <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] px-1">Kalender</h2>
        <Row
          label="Google Kalender"
          description={
            calendarError
              ? calendarError
              : settings.googleCalendarConnected
                ? 'Verbunden — heutige Termine erscheinen auf der Heute-Seite.'
                : 'Zeigt deine heutigen Termine zur Orientierung an, rein lesend.'
          }
        >
          {settings.googleCalendarConnected ? (
            <Button variant="secondary" size="md" className="h-9 px-3 text-[13px]" onClick={() => disconnect()}>
              Trennen
            </Button>
          ) : (
            <Button size="md" className="h-9 px-3 text-[13px]" onClick={() => void connect()} disabled={calendarLoading}>
              Verbinden
            </Button>
          )}
        </Row>
      </div>
    </div>
  );
}

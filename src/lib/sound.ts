import type { SoundId } from '../types/models';

/**
 * Dezente Benachrichtigungstöne, synthetisch per Web Audio erzeugt.
 * Keine Audio-Assets nötig, funktioniert vollständig offline.
 */

let sharedContext: AudioContext | null = null;
let masterVolume = 0.8;

/** Lautstärke aller Benachrichtigungstöne, 0..1. */
export function setSoundVolume(volume: number) {
  masterVolume = Math.min(1, Math.max(0, volume));
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedContext) sharedContext = new AudioCtor();
  if (sharedContext.state === 'suspended') void sharedContext.resume();
  return sharedContext;
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType, peakGain: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  const gainTarget = Math.max(0.0001, peakGain * masterVolume);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainTarget, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

const players: Record<Exclude<SoundId, 'silent'>, (ctx: AudioContext) => void> = {
  'soft-bell': (ctx) => {
    const t = ctx.currentTime;
    tone(ctx, 880, t, 0.9, 'sine', 0.15);
    tone(ctx, 1320, t, 0.7, 'sine', 0.05);
  },
  chime: (ctx) => {
    const t = ctx.currentTime;
    tone(ctx, 660, t, 0.35, 'sine', 0.14);
    tone(ctx, 880, t + 0.16, 0.5, 'sine', 0.14);
  },
  digital: (ctx) => {
    const t = ctx.currentTime;
    tone(ctx, 1046, t, 0.09, 'square', 0.06);
    tone(ctx, 1046, t + 0.14, 0.09, 'square', 0.06);
  },
  wood: (ctx) => {
    const t = ctx.currentTime;
    tone(ctx, 340, t, 0.12, 'triangle', 0.18);
    tone(ctx, 260, t + 0.1, 0.12, 'triangle', 0.12);
  },
};

export function playSound(sound: SoundId | null | undefined) {
  if (!sound || sound === 'silent') return;
  const ctx = getContext();
  if (!ctx) return;
  players[sound](ctx);
}

/** Muss aus einem echten User-Gesture-Handler aufgerufen werden, um AudioContext freizuschalten (iOS/Safari). */
export function unlockAudio() {
  getContext();
}

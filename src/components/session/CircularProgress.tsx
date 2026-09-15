import { useId, type ReactNode } from 'react';

interface CircularProgressProps {
  progress: number; // 0..1, Anteil der bereits verstrichenen Zeit
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  /** Weicher radialer Verlauf statt Vollfarbe (z.B. für das pastellige Salbei-Grün). */
  softGradient?: boolean;
  /** Farbe des noch nicht verstrichenen Ring-Abschnitts. */
  trackColor?: string;
  /** Füllfarbe der Ring-Innenfläche (z.B. die App-Hintergrundfarbe statt transparent). */
  centerFill?: string;
}

export function CircularProgress({
  progress,
  color,
  size = 280,
  strokeWidth = 14,
  children,
  softGradient,
  trackColor = 'var(--color-border)',
  centerFill = 'transparent',
}: CircularProgressProps) {
  const gradientId = useId();
  const r = (size - strokeWidth) / 2;
  const innerR = r - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);
  const stroke = softGradient ? `url(#${gradientId})` : color;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {softGradient && (
          <defs>
            <radialGradient id={gradientId} cx="45%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#E8F4EC" />
              <stop offset="55%" stopColor="#CAE9D5" />
              <stop offset="100%" stopColor={color} />
            </radialGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={innerR} fill={centerFill} stroke="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

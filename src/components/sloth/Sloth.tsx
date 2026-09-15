import { publicUrl } from '../../lib/publicUrl';

export type SlothState = 'idle' | 'planning' | 'running' | 'paused' | 'completed';

interface SlothProps {
  state: SlothState;
  size?: number;
  className?: string;
}

const LABELS: Record<SlothState, string> = {
  idle: 'Schlafendes Faultier',
  planning: 'Waches, aufmerksames Faultier',
  running: 'Faultier begleitet den laufenden Timer',
  paused: 'Entspanntes, pausierendes Faultier',
  completed: 'Zufriedenes Faultier',
};

/**
 * Illustriertes Maskottchen (Spec §54) — wenige konsistente Zustände als Bild-Assets
 * unter /public/sloth/. Rein dekorativ, nie wichtiger als Aufgabe/Restzeit/Endzeit.
 */
export function Sloth({ state, size = 120, className = '' }: SlothProps) {
  return (
    <img
      src={publicUrl(`sloth/${state}.png`)}
      alt={LABELS[state]}
      className={className}
      style={{ width: size, height: 'auto', display: 'block' }}
      draggable={false}
    />
  );
}

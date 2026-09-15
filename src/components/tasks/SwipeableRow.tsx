import { type ReactNode, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: ReactNode;
  onAction: () => void;
  actionLabel: string;
  disabled?: boolean;
}

const REVEAL_WIDTH = 88;
const THRESHOLD = 44;

/**
 * Swipe-nach-links für eine einzelne Kontextaktion (Löschen/Überspringen), Spec §42.
 * Bewusst nur horizontal und mit klarem Schwellwert, um nicht mit iOS-Systemgesten
 * (Zurück-Wisch vom linken Rand, vertikales Scrollen) zu kollidieren.
 */
export function SwipeableRow({ children, onAction, actionLabel, disabled }: SwipeableRowProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<'x' | 'y' | null>(null);

  if (disabled) return <>{children}</>;

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    axisLocked.current = null;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!axisLocked.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (axisLocked.current !== 'x') return;
    e.preventDefault();
    setDragX(Math.max(-REVEAL_WIDTH - 12, Math.min(0, dx)));
  }

  function endDrag() {
    setDragging(false);
    if (dragX <= -THRESHOLD) {
      setDragX(-REVEAL_WIDTH);
    } else {
      setDragX(0);
    }
  }

  const revealed = dragX < -1;

  const actionLayer = revealed ? (
    <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
      <button
        type="button"
        onClick={() => {
          setDragX(0);
          onAction();
        }}
        aria-label={actionLabel}
        className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-500 text-white text-[11px] font-medium"
      >
        <Trash2 size={16} />
        {actionLabel}
      </button>
    </div>
  ) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {actionLayer}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}

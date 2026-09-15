import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[560px] max-h-[88svh] bg-[var(--color-surface)] rounded-t-[28px] shadow-[var(--shadow-soft)] flex flex-col overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.32,0.72,0,1)]"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-2 shrink-0">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-border)]/50 text-[var(--color-text-muted)]"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}

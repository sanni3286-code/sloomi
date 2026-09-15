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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-[480px] max-h-[85svh] bg-[var(--color-surface)] rounded-[28px] shadow-[var(--shadow-soft)] flex flex-col overflow-hidden animate-[popIn_0.2s_cubic-bezier(0.32,0.72,0,1)]">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
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
        <div className="sheet-scroll overflow-y-auto overscroll-contain px-5 pt-2 pb-6" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        .sheet-scroll { scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; }
        .sheet-scroll::-webkit-scrollbar { width: 8px; }
        .sheet-scroll::-webkit-scrollbar-track { background: transparent; }
        .sheet-scroll::-webkit-scrollbar-thumb { background-color: var(--color-border); border-radius: 8px; }
      `}</style>
    </div>
  );
}

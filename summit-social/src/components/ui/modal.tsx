"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={onClose} onKeyDown={() => {}} />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg border border-stone-700 bg-stone-900 p-6 shadow-2xl",
          className,
        )}
      >
        {title && (
          <h2 className="mb-4 font-display text-xl uppercase tracking-widest text-stone-100">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

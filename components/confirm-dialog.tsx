"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { buttonStyles } from "@/components/panel-ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  destructive = true,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const confirmClass = destructive
    ? "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
    : `${buttonStyles.primary} disabled:cursor-wait disabled:opacity-60`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        className="page-enter w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-xl font-semibold tracking-tight text-[#0F172A]">
          {title}
        </h2>
        {description ? (
          <p id="confirm-dialog-description" className="mt-3 text-sm leading-relaxed text-pretty text-[#6B7280]">
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`${buttonStyles.secondary} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={confirmClass}>
            {busy ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

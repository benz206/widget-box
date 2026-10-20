"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      className="confirm-dialog card"
      onClose={onCancel}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <h2 id="confirm-title" className="text-[15px] font-semibold">{title}</h2>
      <p id="confirm-description" className="mt-1 text-[13px] leading-relaxed text-secondary text-pretty">
        {description}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button autoFocus onClick={() => ref.current?.close()}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>,
    document.body
  );
}

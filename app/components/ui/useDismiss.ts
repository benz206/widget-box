import { useCallback, useState } from "react";

export const DISMISS_MS = 200;

export default function useDismiss(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, DISMISS_MS);
  }, [onClose]);
  return [closing, dismiss] as const;
}

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastInput = {
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const triggerSonner = ({ tone, message }: ToastInput) => {
  switch (tone) {
    case "success":
      sonnerToast.success(message);
      break;
    case "error":
      sonnerToast.error(message);
      break;
    case "warning":
      sonnerToast.warning(message);
      break;
    case "info":
      sonnerToast.info(message);
      break;
    default:
      sonnerToast(message);
      break;
  }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((toastInput: ToastInput) => {
    triggerSonner(toastInput);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return {
      showToast: triggerSonner,
    };
  }

  return context;
}

import { useCallback, useState } from "react";
import type { Toast, ToastType } from "../ui/Toast";

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${Date.now()}-${toastIdCounter++}`;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = generateToastId();
      const newToast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "success", duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "error", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "info", duration);
    },
    [showToast]
  );

  const showLoading = useCallback(
    (message: string) => {
      return showToast(message, "loading");
    },
    [showToast]
  );

  const dismissLoading = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismissLoading,
  };
}

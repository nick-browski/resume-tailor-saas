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

      setToasts((previousToasts) => {
        if (previousToasts.some((toast) => toast.id === id)) {
          return previousToasts;
        }
        return [...previousToasts, newToast];
      });
      return id;
    },
    []
  );

  const removeToast = useCallback((toastId: string) => {
    setToasts((previousToasts) =>
      previousToasts.filter((toast) => toast.id !== toastId)
    );
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "success", duration);
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

  const dismissLoading = useCallback((toastId: string) => {
    setToasts((previousToasts) => {
      const toastToDismiss = previousToasts.find(
        (toast) => toast.id === toastId
      );
      if (!toastToDismiss) {
        return previousToasts;
      }
      return previousToasts.filter((toast) => toast.id !== toastId);
    });
  }, []);

  const dismissAllLoading = useCallback(() => {
    setToasts((previousToasts) =>
      previousToasts.filter((toast) => toast.type !== "loading")
    );
  }, []);

  const showError = useCallback(
    (message: string, duration?: number) => {
      dismissAllLoading();
      return showToast(message, "error", duration);
    },
    [showToast, dismissAllLoading]
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
    dismissAllLoading,
  };
}

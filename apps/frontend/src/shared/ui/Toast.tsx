import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (toast.type === "loading") {
      return;
    }

    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-white border border-gray-200 border-l-4 border-l-green-500 text-gray-900 shadow-sm";
      case "error":
        return "bg-white border border-gray-200 border-l-4 border-l-red-500 text-gray-900 shadow-sm";
      case "info":
        return "bg-white border border-gray-200 border-l-4 border-l-blue-500 text-gray-900 shadow-sm";
      case "loading":
        return "bg-white border border-gray-200 border-l-4 border-l-blue-500 text-gray-900 shadow-sm";
      default:
        return "bg-white border border-gray-200 border-l-4 border-l-gray-500 text-gray-900 shadow-sm";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "loading":
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const styles = getStyles();
  const iconColor =
    toast.type === "success"
      ? "text-green-600"
      : toast.type === "error"
      ? "text-red-600"
      : toast.type === "loading"
      ? "text-blue-600"
      : "text-blue-600";

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-md ${styles} min-w-0 sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md ${
        toast.type === "loading" ? "" : "animate-in"
      }`}
    >
      <div className={`flex-shrink-0 ${iconColor}`}>{getIcon()}</div>
      <div className="flex-1 text-xs sm:text-sm font-medium break-words">
        {toast.message}
      </div>
      {toast.type !== "loading" && (
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
          aria-label="Close"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

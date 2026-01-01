import React from "react";
import { ToastContainer } from "@/shared/ui";
import { useToast } from "@/shared/lib/useToast";

interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(
  null
);

export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}

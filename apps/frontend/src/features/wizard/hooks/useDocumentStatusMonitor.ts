import { useEffect, useRef } from "react";
import { useWizardStore } from "../model/wizardStore";
import { useDocumentById } from "../api/useDocuments";
import { useToastContext } from "@/app/providers/ToastProvider";
import {
  WIZARD_CONSTANTS,
  TOAST_MESSAGES,
  DOCUMENT_STATUS,
} from "@/shared/lib/constants";

// Monitors document status changes and shows toast notifications
// Updates maxReachedStep when generation completes
export function useDocumentStatusMonitor() {
  const documentId = useWizardStore((state) => state.documentId);
  const maxReachedStep = useWizardStore((state) => state.maxReachedStep);
  const setMaxReachedStep = useWizardStore((state) => state.setMaxReachedStep);
  const { data: documentData, error } = useDocumentById(documentId);
  const toast = useToastContext();
  const previousStatusRef = useRef<string | undefined>(undefined);
  const errorShownRef = useRef(false);

  // Shows toast notifications on status changes and updates maxReachedStep
  useEffect(() => {
    if (!documentData) return;

    const currentStatus = documentData.status;
    const previousStatus = previousStatusRef.current;

    if (previousStatus === currentStatus) return;

    if (
      currentStatus === DOCUMENT_STATUS.GENERATED &&
      documentData.tailoredText
    ) {
      toast.showSuccess(TOAST_MESSAGES.RESUME_GENERATED_SUCCESS);
      if (maxReachedStep < WIZARD_CONSTANTS.LAST_STEP) {
        setMaxReachedStep(WIZARD_CONSTANTS.LAST_STEP);
      }
    } else if (currentStatus === DOCUMENT_STATUS.FAILED) {
      const errorMessage =
        documentData.error || TOAST_MESSAGES.RESUME_GENERATION_FAILED;
      toast.showError(errorMessage);
    }

    previousStatusRef.current = currentStatus;
  }, [documentData, toast, maxReachedStep, setMaxReachedStep]);

  // Resets status tracking when documentId changes
  useEffect(() => {
    previousStatusRef.current = undefined;
    errorShownRef.current = false;
  }, [documentId]);

  // Shows error toast when document query fails
  useEffect(() => {
    if (error && !errorShownRef.current) {
      toast.showError(TOAST_MESSAGES.DOCUMENT_LOAD_FAILED);
      errorShownRef.current = true;
    } else if (!error) {
      errorShownRef.current = false;
    }
  }, [error, toast]);
}

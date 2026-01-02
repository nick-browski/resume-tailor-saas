import { useEffect, useRef } from "react";
import { useWizardStore } from "../model/wizardStore";
import { useDocumentById } from "../api/useDocuments";
import { useToastContext } from "@/app/providers/ToastProvider";
import {
  WIZARD_CONSTANTS,
  TOAST_MESSAGES,
  DOCUMENT_STATUS,
} from "@/shared/lib/constants";

export function useDocumentStatusMonitor() {
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const setGenerationToastId = useWizardStore(
    (state) => state.setGenerationToastId
  );
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const setJobDescriptionText = useWizardStore(
    (state) => state.setJobDescriptionText
  );
  const maxReachedStep = useWizardStore((state) => state.maxReachedStep);
  const setMaxReachedStep = useWizardStore((state) => state.setMaxReachedStep);
  const nextStep = useWizardStore((state) => state.nextStep);

  const { data: documentDataSnapshot, error: documentError } =
    useDocumentById(documentId);

  const toast = useToastContext();
  const processedDocumentIdRef = useRef<string | null>(null);
  const processedStatusRef = useRef<string | null>(null);

  // Restore state on page refresh, navigate when generation completes
  useEffect(() => {
    if (
      !documentDataSnapshot ||
      documentDataSnapshot.status !== DOCUMENT_STATUS.GENERATED
    ) {
      return;
    }

    const isNewDocument =
      processedDocumentIdRef.current !== documentDataSnapshot.id;

    if (isNewDocument) {
      if (documentDataSnapshot.resumeText) {
        setResumeData({ file: null, text: documentDataSnapshot.resumeText });
      }
      if (documentDataSnapshot.jobText) {
        setJobDescriptionText(documentDataSnapshot.jobText);
      }
      if (maxReachedStep < WIZARD_CONSTANTS.LAST_STEP) {
        setMaxReachedStep(WIZARD_CONSTANTS.LAST_STEP);
      }
      processedDocumentIdRef.current = documentDataSnapshot.id;

      // Navigate to preview step when generation completes
      const currentStepSnapshot = useWizardStore.getState().currentStep;
      const isOnPreviewStep =
        currentStepSnapshot === WIZARD_CONSTANTS.LAST_STEP;
      const hasPdfReady = !!documentDataSnapshot.pdfResultPath;

      if (hasPdfReady && !isOnPreviewStep) {
        nextStep();
      }
    }
  }, [
    documentDataSnapshot,
    maxReachedStep,
    setResumeData,
    setJobDescriptionText,
    setMaxReachedStep,
    nextStep,
  ]);

  // Show loading toast on page refresh during active generation
  useEffect(() => {
    if (
      documentId &&
      !generationToastId &&
      documentDataSnapshot &&
      (documentDataSnapshot.status === DOCUMENT_STATUS.PARSED ||
        documentDataSnapshot.status === DOCUMENT_STATUS.GENERATING)
    ) {
      const loadingToastId = toast.showLoading(
        TOAST_MESSAGES.STARTING_RESUME_GENERATION
      );
      setGenerationToastId(loadingToastId);
    }
  }, [
    documentId,
    generationToastId,
    documentDataSnapshot,
    setGenerationToastId,
    toast,
  ]);

  // Handle final status: dismiss loading toast, show result, prevent duplicates
  useEffect(() => {
    if (!documentDataSnapshot || !generationToastId) {
      return;
    }

    const documentStatus = documentDataSnapshot.status;
    const isFinalStatus =
      documentStatus === DOCUMENT_STATUS.GENERATED ||
      documentStatus === DOCUMENT_STATUS.FAILED;

    if (!isFinalStatus) {
      return;
    }

    if (
      processedDocumentIdRef.current === documentDataSnapshot.id &&
      processedStatusRef.current === documentStatus
    ) {
      return;
    }

    processedDocumentIdRef.current = documentDataSnapshot.id;
    processedStatusRef.current = documentStatus;
    toast.dismissLoading(generationToastId);
    setGenerationToastId(null);

    if (documentStatus === DOCUMENT_STATUS.GENERATED) {
      toast.showSuccess(TOAST_MESSAGES.RESUME_GENERATED_SUCCESS);
      if (maxReachedStep < WIZARD_CONSTANTS.LAST_STEP) {
        setMaxReachedStep(WIZARD_CONSTANTS.LAST_STEP);
      }
    } else if (documentStatus === DOCUMENT_STATUS.FAILED) {
      const errorMessage =
        documentDataSnapshot.error || TOAST_MESSAGES.RESUME_GENERATION_FAILED;
      toast.showError(errorMessage);
    }
  }, [
    documentDataSnapshot,
    generationToastId,
    setGenerationToastId,
    maxReachedStep,
    setMaxReachedStep,
    toast,
  ]);

  // Reset tracking on new generation
  useEffect(() => {
    if (!documentId) {
      processedDocumentIdRef.current = null;
      processedStatusRef.current = null;
    }
  }, [documentId]);

  // Handle fetch errors
  useEffect(() => {
    if (
      documentError &&
      processedDocumentIdRef.current !== documentId &&
      documentId
    ) {
      toast.showError(TOAST_MESSAGES.DOCUMENT_LOAD_FAILED);
    }
  }, [documentError, documentId, toast]);
}

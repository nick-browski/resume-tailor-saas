import { useEffect, useRef } from "react";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { useWizardStore, getScenarioFromUrl } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { db } from "@/shared/config/firebase";
import { useAuthReady } from "@/shared/config/auth";
import { convertFirestoreSnapshotToDocument } from "@/shared/api/documentUtils";
import {
  WIZARD_CONSTANTS,
  TOAST_MESSAGES,
  DOCUMENT_STATUS,
  ORIGINAL_PARSE_STATUS,
} from "@/shared/lib/constants";
import { formatServerError } from "@/shared/lib/errorFormatter";

export function useDocumentStatusMonitor() {
  const { user, isReady } = useAuthReady();
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const parseToastId = useWizardStore((state) => state.parseToastId);
  const currentStep = useWizardStore((state) => state.currentStep);
  const selectedScenario = useWizardStore((state) => state.selectedScenario);
  const setGenerationToastId = useWizardStore(
    (state) => state.setGenerationToastId
  );
  const setParseToastId = useWizardStore((state) => state.setParseToastId);
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const setJobDescriptionText = useWizardStore(
    (state) => state.setJobDescriptionText
  );
  const maxReachedStep = useWizardStore((state) => state.maxReachedStep);
  const setMaxReachedStep = useWizardStore((state) => state.setMaxReachedStep);
  const reset = useWizardStore((state) => state.reset);
  const resumeData = useWizardStore((state) => state.resumeData);
  const nextStep = useWizardStore((state) => state.nextStep);

  const lastStep =
    selectedScenario === "edit"
      ? WIZARD_CONSTANTS.LAST_STEP_EDIT_SCENARIO
      : WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO;

  const toast = useToastContext();
  const previousStatusRef = useRef<string | null>(null);
  const processedFinalStatusRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const shownLoadErrorForDocIdRef = useRef<string | null>(null);
  const hasShownExpiredMessageRef = useRef<string | null>(null);

  const dismissGenerationToast = () => {
    if (generationToastId) {
      toast.dismissLoading(generationToastId);
      setGenerationToastId(null);
    }
  };

  const getEffectiveScenario = () => {
    return selectedScenario || getScenarioFromUrl();
  };

  // Subscribe to Firestore document changes in real-time
  // Only subscribe after auth is ready to prevent permission-denied errors
  useEffect(() => {
    if (!documentId) {
      previousStatusRef.current = null;
      processedFinalStatusRef.current = null;
      shownLoadErrorForDocIdRef.current = null;
      hasShownExpiredMessageRef.current = null;
      return;
    }

    // Reset tracking when documentId changes (new document loaded)
    // Note: We don't reset here because documentId might be the same across multiple edits

    if (!user || !isReady) {
      return;
    }

    const documentRef = doc(db, "documents", documentId);

    // Don't show toast on initial mount - only show when status changes to "generating"
    // This prevents showing toast when document is created but not yet generating

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    unsubscribeRef.current = onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          if (hasShownExpiredMessageRef.current !== documentId) {
            dismissGenerationToast();
            if (parseToastId) {
              toast.dismissLoading(parseToastId);
              setParseToastId(null);
            }
            toast.showError(TOAST_MESSAGES.DOCUMENT_EXPIRED);
            reset();
            hasShownExpiredMessageRef.current = documentId;
          }
          return;
        }

        const data = snapshot.data();
        if (data.ownerId && data.ownerId !== user.uid) {
          return;
        }

        const documentData = convertFirestoreSnapshotToDocument(snapshot);

        // Handle original resume parsing status
        if (parseToastId) {
          const originalParseStatus = documentData.originalParseStatus;
          const isParseComplete =
            originalParseStatus === ORIGINAL_PARSE_STATUS.PARSED &&
            documentData.originalResumeData?.trim();

          if (
            isParseComplete ||
            originalParseStatus === ORIGINAL_PARSE_STATUS.FAILED
          ) {
            toast.dismissLoading(parseToastId);
            setParseToastId(null);

            if (originalParseStatus === ORIGINAL_PARSE_STATUS.FAILED) {
              toast.showError(TOAST_MESSAGES.PARSE_ORIGINAL_RESUME_FAILED);
            }
          }
        }

        const documentStatus = documentData.status;
        const previousStatus = previousStatusRef.current;
        const isStatusTransition = previousStatus !== documentStatus;
        const isNewDocument = previousStatus === null;

        // Handle status transition to "generating"
        if (
          documentStatus === DOCUMENT_STATUS.GENERATING &&
          isStatusTransition &&
          !isNewDocument
        ) {
          processedFinalStatusRef.current = null;
          dismissGenerationToast();

          const effectiveScenario = getEffectiveScenario();
          const loadingMessage =
            effectiveScenario === "edit"
              ? TOAST_MESSAGES.STARTING_RESUME_EDIT
              : TOAST_MESSAGES.STARTING_RESUME_GENERATION;
          const loadingToastId = toast.showLoading(loadingMessage);
          setGenerationToastId(loadingToastId);
        }

        // Handle final status transitions
        const isFinalStatus =
          documentStatus === DOCUMENT_STATUS.GENERATED ||
          documentStatus === DOCUMENT_STATUS.FAILED;

        if (!isFinalStatus || !isStatusTransition) {
          previousStatusRef.current = documentStatus;
          return;
        }

        // Check if PDF is ready for generated status
        const hasPdfReady =
          documentStatus === DOCUMENT_STATUS.GENERATED &&
          !!documentData.pdfResultPath;

        if (documentStatus === DOCUMENT_STATUS.GENERATED && !hasPdfReady) {
          previousStatusRef.current = documentStatus;
          return;
        }

        // Prevent duplicate processing
        const finalStatusKey = `${documentData.id}-${documentStatus}`;
        if (processedFinalStatusRef.current === finalStatusKey) {
          previousStatusRef.current = documentStatus;
          return;
        }
        processedFinalStatusRef.current = finalStatusKey;

        dismissGenerationToast();

        // Handle success case
        if (documentStatus === DOCUMENT_STATUS.GENERATED) {
          const effectiveScenario = getEffectiveScenario();
          const successMessage =
            effectiveScenario === "edit"
              ? TOAST_MESSAGES.RESUME_EDITED_SUCCESS
              : TOAST_MESSAGES.RESUME_GENERATED_SUCCESS;
          toast.showSuccess(successMessage);

          // Update store for new documents
          if (isNewDocument && documentData.resumeText) {
            setResumeData({
              file: resumeData?.file ?? null,
              text: documentData.resumeText,
            });
          }
          if (isNewDocument && documentData.jobText) {
            setJobDescriptionText(documentData.jobText);
          }

          // Update max reached step
          if (maxReachedStep < lastStep) {
            setMaxReachedStep(lastStep);
          }

          // Auto-advance to Preview
          if (
            hasPdfReady &&
            currentStep !== lastStep &&
            previousStatus !== DOCUMENT_STATUS.GENERATED
          ) {
            nextStep();
          }
        } else {
          // Handle failure case
          const errorMessage = formatServerError(
            documentData.error ? new Error(documentData.error) : null
          );
          toast.showError(errorMessage);
          reset();
        }

        previousStatusRef.current = documentStatus;
      },
      (error) => {
        const code = error?.code;
        const transient = new Set([
          "unavailable",
          "cancelled",
          "deadline-exceeded",
          "resource-exhausted",
          "internal",
          "permission-denied",
        ]);

        if (code && transient.has(code)) {
          return;
        }

        if (shownLoadErrorForDocIdRef.current === documentId) return;
        shownLoadErrorForDocIdRef.current = documentId;

        toast.showError(TOAST_MESSAGES.DOCUMENT_LOAD_FAILED);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    isReady,
    user,
    documentId,
    generationToastId,
    parseToastId,
    currentStep,
    selectedScenario,
    lastStep,
    setGenerationToastId,
    setParseToastId,
    setResumeData,
    setJobDescriptionText,
    maxReachedStep,
    setMaxReachedStep,
    nextStep,
    reset,
    toast,
  ]);
}

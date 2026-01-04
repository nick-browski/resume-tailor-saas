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

  // Determine last step based on scenario
  const lastStep =
    selectedScenario === "edit"
      ? WIZARD_CONSTANTS.LAST_STEP_EDIT_SCENARIO
      : WIZARD_CONSTANTS.LAST_STEP_TAILOR_SCENARIO;
  const nextStep = useWizardStore((state) => state.nextStep);

  const toast = useToastContext();
  const processedDocumentIdRef = useRef<string | null>(null);
  const processedStatusRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const shownLoadErrorForDocIdRef = useRef<string | null>(null);
  const hasShownExpiredMessageRef = useRef<string | null>(null);

  // Subscribe to Firestore document changes in real-time
  // Only subscribe after auth is ready to prevent permission-denied errors
  useEffect(() => {
    if (!documentId) {
      processedDocumentIdRef.current = null;
      processedStatusRef.current = null;
      shownLoadErrorForDocIdRef.current = null;
      hasShownExpiredMessageRef.current = null;
      return;
    }

    // Reset tracking when documentId changes (new document loaded)
    if (processedDocumentIdRef.current !== documentId) {
      processedDocumentIdRef.current = null;
      processedStatusRef.current = null;
    }

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
          // Document expired (TTL) or deleted
          if (hasShownExpiredMessageRef.current !== documentId) {
            if (generationToastId) {
              toast.dismissLoading(generationToastId);
              setGenerationToastId(null);
            }
            if (parseToastId) {
              toast.dismissLoading(parseToastId);
              setParseToastId(null);
            }
            toast.showError(TOAST_MESSAGES.DOCUMENT_EXPIRED);
            // Reset wizard to initial state
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

          if (
            originalParseStatus === ORIGINAL_PARSE_STATUS.PARSED &&
            documentData.originalResumeData &&
            documentData.originalResumeData.trim() !== ""
          ) {
            toast.dismissLoading(parseToastId);
            setParseToastId(null);
          }

          if (originalParseStatus === ORIGINAL_PARSE_STATUS.FAILED) {
            toast.dismissLoading(parseToastId);
            setParseToastId(null);
            toast.showError(TOAST_MESSAGES.PARSE_ORIGINAL_RESUME_FAILED);
          }
        }

        const documentStatus = documentData.status;
        const isNewDocument =
          processedDocumentIdRef.current !== documentData.id;
        const previousStatus = processedStatusRef.current;
        const isFinalStatus =
          documentStatus === DOCUMENT_STATUS.GENERATED ||
          documentStatus === DOCUMENT_STATUS.FAILED;

        // Initialize status tracking on first snapshot
        if (processedStatusRef.current === null) {
          processedStatusRef.current = documentStatus;
        }

        // Show toast only when status changes to "generating" (not on initial mount or other statuses)
        if (
          documentStatus === DOCUMENT_STATUS.GENERATING &&
          previousStatus !== DOCUMENT_STATUS.GENERATING &&
          previousStatus !== null &&
          !generationToastId
        ) {
          // Determine scenario from URL if not set in store (fallback)
          const scenarioFromUrl = getScenarioFromUrl();
          const effectiveScenario = selectedScenario || scenarioFromUrl;

          const loadingMessage =
            effectiveScenario === "edit"
              ? TOAST_MESSAGES.STARTING_RESUME_EDIT
              : TOAST_MESSAGES.STARTING_RESUME_GENERATION;
          const loadingToastId = toast.showLoading(loadingMessage);
          setGenerationToastId(loadingToastId);
        }

        const shouldDismissToast =
          isFinalStatus &&
          (documentStatus === DOCUMENT_STATUS.FAILED ||
            (documentStatus === DOCUMENT_STATUS.GENERATED &&
              !!documentData.pdfResultPath));

        if (shouldDismissToast) {
          if (
            processedDocumentIdRef.current === documentData.id &&
            processedStatusRef.current === documentStatus
          ) {
            return;
          }

          processedDocumentIdRef.current = documentData.id;
          processedStatusRef.current = documentStatus;

          if (generationToastId) {
            toast.dismissLoading(generationToastId);
            setGenerationToastId(null);
          }

          if (documentStatus === DOCUMENT_STATUS.GENERATED) {
            // Show success toast only when status changed from non-GENERATED to GENERATED
            const statusChangedToGenerated =
              previousStatus !== null &&
              previousStatus !== DOCUMENT_STATUS.GENERATED;

            if (statusChangedToGenerated) {
              const scenarioFromUrl = getScenarioFromUrl();
              const effectiveScenario = selectedScenario || scenarioFromUrl;
              const successMessage =
                effectiveScenario === "edit"
                  ? TOAST_MESSAGES.RESUME_EDITED_SUCCESS
                  : TOAST_MESSAGES.RESUME_GENERATED_SUCCESS;
              toast.showSuccess(successMessage);
            }

            // Update store data and maxReachedStep for new documents
            if (isNewDocument) {
              if (documentData.resumeText) {
                setResumeData({ file: null, text: documentData.resumeText });
              }
              if (documentData.jobText) {
                setJobDescriptionText(documentData.jobText);
              }
              if (maxReachedStep < lastStep) {
                setMaxReachedStep(lastStep);
              }
            } else if (maxReachedStep < lastStep) {
              setMaxReachedStep(lastStep);
            }

            // Auto-advance to Preview if document is ready and not already on Preview
            const isOnPreviewStep = currentStep === lastStep;
            const hasPdfReady = !!documentData.pdfResultPath;
            const isNewDocumentAlreadyReady =
              isNewDocument && previousStatus === null;
            const shouldAutoAdvance =
              hasPdfReady &&
              !isOnPreviewStep &&
              (statusChangedToGenerated || isNewDocumentAlreadyReady);

            if (shouldAutoAdvance) {
              nextStep();
            }
          } else if (documentStatus === DOCUMENT_STATUS.FAILED) {
            const errorMessage =
              documentData.error || TOAST_MESSAGES.RESUME_GENERATION_FAILED;
            toast.showError(errorMessage);
          }
        }
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

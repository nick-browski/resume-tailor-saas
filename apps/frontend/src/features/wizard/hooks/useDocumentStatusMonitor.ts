import { useEffect, useRef } from "react";
import { doc, onSnapshot, Unsubscribe, getDoc } from "firebase/firestore";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { db } from "@/shared/config/firebase";
import { useAuthReady } from "@/shared/config/auth";
import { convertFirestoreSnapshotToDocument } from "@/shared/api/documentUtils";
import {
  WIZARD_CONSTANTS,
  TOAST_MESSAGES,
  DOCUMENT_STATUS,
} from "@/shared/lib/constants";

export function useDocumentStatusMonitor() {
  const { user, isReady } = useAuthReady();
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const parseToastId = useWizardStore((state) => state.parseToastId);
  const currentStep = useWizardStore((state) => state.currentStep);
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
  const nextStep = useWizardStore((state) => state.nextStep);

  const toast = useToastContext();
  const processedDocumentIdRef = useRef<string | null>(null);
  const processedStatusRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const shownLoadErrorForDocIdRef = useRef<string | null>(null);

  // Subscribe to Firestore document changes in real-time
  // Only subscribe after auth is ready to prevent permission-denied errors
  useEffect(() => {
    if (!documentId) {
      processedDocumentIdRef.current = null;
      processedStatusRef.current = null;
      shownLoadErrorForDocIdRef.current = null;
      return;
    }

    if (!user || !isReady) {
      return;
    }

    const documentRef = doc(db, "documents", documentId);

    const showLoadingToastIfNeeded = () => {
      if (!generationToastId) {
        const loadingToastId = toast.showLoading(
          TOAST_MESSAGES.STARTING_RESUME_GENERATION
        );
        setGenerationToastId(loadingToastId);
      }
    };

    getDoc(documentRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const status = snapshot.data()?.status;
          const isFinalStatus =
            status === DOCUMENT_STATUS.GENERATED ||
            status === DOCUMENT_STATUS.FAILED;
          if (isFinalStatus) {
            return;
          }
        }
        showLoadingToastIfNeeded();
      })
      .catch(() => {
        showLoadingToastIfNeeded();
      });

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    unsubscribeRef.current = onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();
        if (data.ownerId && data.ownerId !== user.uid) {
          return;
        }

        const documentData = convertFirestoreSnapshotToDocument(snapshot);

        if (
          parseToastId &&
          documentData.originalResumeData &&
          documentData.originalResumeData.trim() !== ""
        ) {
          toast.dismissLoading(parseToastId);
          setParseToastId(null);
        }

        const documentStatus = documentData.status;
        const isNewDocument =
          processedDocumentIdRef.current !== documentData.id;
        const isFinalStatus =
          documentStatus === DOCUMENT_STATUS.GENERATED ||
          documentStatus === DOCUMENT_STATUS.FAILED;

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
            toast.showSuccess(TOAST_MESSAGES.RESUME_GENERATED_SUCCESS);

            if (isNewDocument) {
              if (documentData.resumeText) {
                setResumeData({ file: null, text: documentData.resumeText });
              }
              if (documentData.jobText) {
                setJobDescriptionText(documentData.jobText);
              }
              if (maxReachedStep < WIZARD_CONSTANTS.LAST_STEP) {
                setMaxReachedStep(WIZARD_CONSTANTS.LAST_STEP);
              }

              const isOnPreviewStep =
                currentStep === WIZARD_CONSTANTS.LAST_STEP;
              const hasPdfReady = !!documentData.pdfResultPath;

              if (hasPdfReady && !isOnPreviewStep) {
                nextStep();
              }
            } else if (maxReachedStep < WIZARD_CONSTANTS.LAST_STEP) {
              setMaxReachedStep(WIZARD_CONSTANTS.LAST_STEP);
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
    setGenerationToastId,
    setParseToastId,
    setResumeData,
    setJobDescriptionText,
    maxReachedStep,
    setMaxReachedStep,
    nextStep,
    toast,
  ]);
}

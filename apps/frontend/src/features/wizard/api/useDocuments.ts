import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/shared/config/firebase";
import { useAuthReady } from "@/shared/config/auth";
import { documentsApi, convertFirestoreSnapshotToDocument } from "@/shared/api";
import type { CreateDocumentRequest, Document } from "@/shared/api";
import {
  QUERY_KEYS,
  TOAST_MESSAGES,
  WIZARD_CONSTANTS,
} from "@/shared/lib/constants";
import { useToastContext } from "@/app/providers/ToastProvider";
import { useWizardStore } from "../model/wizardStore";

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createDocumentRequest: CreateDocumentRequest) =>
      documentsApi.create(createDocumentRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENTS] });
    },
  });
}

export function useDocumentById(documentId: string | null) {
  const { user, isReady } = useAuthReady();
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastContext();
  const reset = useWizardStore((state) => state.reset);
  const setStep = useWizardStore((state) => state.setStep);
  const setDocumentId = useWizardStore((state) => state.setDocumentId);
  const previousDocumentIdRef = useRef<string | null>(null);
  const wasDocumentLoadedRef = useRef<boolean>(false);
  const hasShownAccessDeniedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady || !user) {
      setIsLoading(true);
      return;
    }

    if (!documentId) {
      setDocumentData(null);
      setIsLoading(false);
      previousDocumentIdRef.current = null;
      wasDocumentLoadedRef.current = false;
      hasShownAccessDeniedRef.current = null;
      return;
    }

    // Track if this is a new document
    if (previousDocumentIdRef.current !== documentId) {
      wasDocumentLoadedRef.current = false;
      previousDocumentIdRef.current = documentId;
      hasShownAccessDeniedRef.current = null;
    }

    setIsLoading(true);
    const documentRef = doc(db, "documents", documentId);

    const unsubscribe = onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document expired (TTL) or deleted
          if (wasDocumentLoadedRef.current) {
            toast.showError(TOAST_MESSAGES.DOCUMENT_EXPIRED);
            reset();
          }
          setDocumentData(null);
          setIsLoading(false);
          wasDocumentLoadedRef.current = false;
          return;
        }

        const doc = convertFirestoreSnapshotToDocument(snapshot);
        setDocumentData(doc);
        setIsLoading(false);
        wasDocumentLoadedRef.current = true;
      },
      (error) => {
        if (error?.code === "permission-denied") {
          if (hasShownAccessDeniedRef.current !== documentId) {
            hasShownAccessDeniedRef.current = documentId;
            toast.showError(TOAST_MESSAGES.DOCUMENT_ACCESS_DENIED);
            setDocumentId(null);
            setStep(WIZARD_CONSTANTS.FIRST_STEP);
          }
          setIsLoading(false);
          setDocumentData(null);
          return;
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isReady, user, documentId, toast, reset, setStep, setDocumentId]);

  return { data: documentData, isLoading };
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS],
    queryFn: () => documentsApi.getAll(),
  });
}

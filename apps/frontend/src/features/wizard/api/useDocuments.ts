import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/shared/config/firebase";
import { useAuthReady } from "@/shared/config/auth";
import { documentsApi, convertFirestoreSnapshotToDocument } from "@/shared/api";
import type { CreateDocumentRequest, Document } from "@/shared/api";
import { QUERY_KEYS, TOAST_MESSAGES } from "@/shared/lib/constants";
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
  const previousDocumentIdRef = useRef<string | null>(null);
  const wasDocumentLoadedRef = useRef<boolean>(false);

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
      return;
    }

    // Track if this is a new document
    if (previousDocumentIdRef.current !== documentId) {
      wasDocumentLoadedRef.current = false;
      previousDocumentIdRef.current = documentId;
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
        if (error?.code !== "permission-denied") {
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [isReady, user, documentId, toast, reset]);

  return { data: documentData, isLoading };
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS],
    queryFn: () => documentsApi.getAll(),
  });
}

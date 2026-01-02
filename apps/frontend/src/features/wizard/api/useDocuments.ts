import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/shared/config/firebase";
import { useAuthReady } from "@/shared/config/auth";
import { documentsApi, convertFirestoreSnapshotToDocument } from "@/shared/api";
import type { CreateDocumentRequest, Document } from "@/shared/api";
import { QUERY_KEYS } from "@/shared/lib/constants";

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

  useEffect(() => {
    if (!isReady || !user) {
      setIsLoading(true);
      return;
    }

    if (!documentId) {
      setDocumentData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const documentRef = doc(db, "documents", documentId);

    const unsubscribe = onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDocumentData(null);
          setIsLoading(false);
          return;
        }

        const doc = convertFirestoreSnapshotToDocument(snapshot);
        setDocumentData(doc);
        setIsLoading(false);
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [isReady, user, documentId]);

  return { data: documentData, isLoading };
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS],
    queryFn: () => documentsApi.getAll(),
  });
}

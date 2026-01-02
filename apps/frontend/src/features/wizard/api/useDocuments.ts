import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { documentsApi } from "@/shared/api";
import type { CreateDocumentRequest } from "@/shared/api";
import {
  TIMING_CONSTANTS,
  DOCUMENT_STATUS,
  QUERY_KEYS,
} from "@/shared/lib/constants";

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

// Polls document by id until GENERATED/FAILED or timeout
// Stops polling when generation completes or fails to prevent infinite requests
export function useDocumentById(documentId: string | null) {
  const pollingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    pollingStartTimeRef.current = documentId ? Date.now() : null;
  }, [documentId]);

  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS, QUERY_KEYS.DOCUMENT, documentId],
    queryFn: () => documentsApi.getById(documentId!),
    enabled: !!documentId,
    refetchInterval: (queryStateSnapshot) => {
      const documentDataSnapshot = queryStateSnapshot.state.data;
      const pollingStartTime = pollingStartTimeRef.current;

      // Stop polling after timeout to prevent infinite requests
      if (
        pollingStartTime !== null &&
        Date.now() - pollingStartTime >
          TIMING_CONSTANTS.DOCUMENT_POLL_TIMEOUT_MS
      ) {
        return false;
      }

      if (!documentDataSnapshot) {
        return TIMING_CONSTANTS.DOCUMENT_POLL_INTERVAL_MS;
      }

      // Stop polling when generation reaches final state (success or failure)
      const isFinalStatus =
        documentDataSnapshot.status === DOCUMENT_STATUS.GENERATED ||
        documentDataSnapshot.status === DOCUMENT_STATUS.FAILED;

      return isFinalStatus ? false : TIMING_CONSTANTS.DOCUMENT_POLL_INTERVAL_MS;
    },
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS],
    queryFn: () => documentsApi.getAll(),
  });
}

// Parses original resume into structured JSON format
export function useParseOriginalResume(
  documentId: string | null,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS, "parseOriginal", documentId],
    queryFn: () => documentsApi.parseOriginalResume(documentId!),
    enabled: enabled && !!documentId,
    staleTime: Infinity,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/shared/api";
import type { CreateDocumentRequest } from "@/shared/api";
import { TIMING_CONSTANTS, DOCUMENT_STATUS } from "@/shared/lib/constants";

const DOCUMENTS_QUERY_KEY = "documents";

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (createRequest: CreateDocumentRequest) =>
      documentsApi.create(createRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
    },
  });
}

// Polls document status while generating
export function useDocumentById(documentId: string | null) {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, documentId],
    queryFn: () => documentsApi.getById(documentId!),
    enabled: !!documentId,
    refetchInterval: (query) => {
      const documentData = query.state.data;
      const shouldPoll =
        documentData?.status === DOCUMENT_STATUS.PARSED ||
        documentData?.status === DOCUMENT_STATUS.GENERATING;
      return shouldPoll ? TIMING_CONSTANTS.DOCUMENT_POLL_INTERVAL_MS : false;
    },
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY],
    queryFn: () => documentsApi.getAll(),
  });
}

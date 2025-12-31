import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/shared/api";
import type { CreateDocumentRequest } from "@/shared/api";

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

export function useDocumentById(documentId: string | null) {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY, documentId],
    queryFn: () => documentsApi.getById(documentId!),
    enabled: !!documentId,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY],
    queryFn: () => documentsApi.getAll(),
  });
}

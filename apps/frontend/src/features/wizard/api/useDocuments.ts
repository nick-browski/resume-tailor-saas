import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/shared/api";
import type { CreateDocumentRequest } from "@/shared/api";

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDocumentRequest) =>
      documentsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDocumentById(id: string | null) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useAllDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => documentsApi.getAll(),
  });
}

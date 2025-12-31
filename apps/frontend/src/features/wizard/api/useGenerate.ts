import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateApi } from "@/shared/api";
import type { GenerateResumeRequest } from "@/shared/api";

const DOCUMENTS_QUERY_KEY = "documents";

export function useGenerateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generateRequest: GenerateResumeRequest) =>
      generateApi.generate(generateRequest),
    onSuccess: (generateResponse) => {
      queryClient.invalidateQueries({
        queryKey: [DOCUMENTS_QUERY_KEY, generateResponse.documentId],
      });
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
    },
  });
}

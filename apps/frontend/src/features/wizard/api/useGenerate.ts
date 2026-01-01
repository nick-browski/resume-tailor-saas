import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateApi } from "@/shared/api";
import type { GenerateResumeRequest } from "@/shared/api";
import { QUERY_KEYS } from "@/shared/lib/constants";

export function useGenerateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generateResumeRequest: GenerateResumeRequest) =>
      generateApi.generate(generateResumeRequest),
    onSuccess: (_unusedGenerateResponseData, generateRequestVariables) => {
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.DOCUMENTS,
          QUERY_KEYS.DOCUMENT,
          generateRequestVariables.documentId,
        ],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DOCUMENTS] });
    },
  });
}

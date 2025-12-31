import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateApi } from "@/shared/api";
import type { GenerateResumeRequest } from "@/shared/api";

export function useGenerateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateResumeRequest) =>
      generateApi.generate(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", data.documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}


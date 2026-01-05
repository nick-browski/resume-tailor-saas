import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { matchApi } from "@/shared/api";
import { useToastContext } from "@/app/providers/ToastProvider";
import { TOAST_MESSAGES, UI_TEXT } from "@/shared/lib/constants";
import type {
  MatchCheckRequest,
  MatchCheckResponse,
  ResumeInputData,
} from "@/shared/api/types";

interface MatchCheckErrors {
  matchError?: string;
  matchResult?: MatchCheckResponse;
}

interface UseMatchCheckResult {
  matchErrors: MatchCheckErrors;
  isCheckingMatch: boolean;
  checkMatch: (
    resumeData: ResumeInputData | null,
    jobDescriptionText: string
  ) => Promise<{
    extractedResumeText: string | null;
    isMatch: boolean;
    matchResult?: MatchCheckResponse;
  } | null>;
}

export function useMatchCheck(): UseMatchCheckResult {
  const toast = useToastContext();
  const [matchErrors, setMatchErrors] = useState<MatchCheckErrors>({});

  const { mutateAsync: matchCheckApi, isPending: isCheckingMatch } =
    useMutation<MatchCheckResponse, Error, MatchCheckRequest>({
      mutationFn: (request) => matchApi.match(request),
    });

  const checkMatch = useCallback(
    async (
      resumeData: ResumeInputData | null,
      jobDescriptionText: string
    ): Promise<{
      extractedResumeText: string | null;
      isMatch: boolean;
      matchResult?: MatchCheckResponse;
    } | null> => {
      if (!resumeData || (!resumeData.text && !resumeData.file)) {
        toast.showError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
        return null;
      }

      if (!jobDescriptionText.trim()) {
        toast.showError(UI_TEXT.JOB_DESCRIPTION_REQUIRED_ERROR);
        return null;
      }

      const matchCheckToastId = toast.showLoading(
        TOAST_MESSAGES.CHECKING_MATCH
      );

      try {
        const matchCheckResponse = await matchCheckApi({
          file: resumeData.file || undefined,
          resumeText: resumeData.text || undefined,
          jobText: jobDescriptionText,
        });

        toast.dismissLoading(matchCheckToastId);

        const extractedResumeText =
          matchCheckResponse.extractedResumeText || resumeData?.text || null;

        if (!matchCheckResponse.isMatch) {
          const errorMessage =
            matchCheckResponse.reasons?.join(". ") ||
            UI_TEXT.MATCH_CHECK_NO_MATCH;

          setMatchErrors({
            matchError: errorMessage,
            matchResult: matchCheckResponse,
          });
          return {
            extractedResumeText,
            isMatch: false,
            matchResult: matchCheckResponse,
          };
        }

        setMatchErrors({});
        return {
          extractedResumeText,
          isMatch: true,
          matchResult: matchCheckResponse,
        };
      } catch (matchCheckError) {
        toast.dismissLoading(matchCheckToastId);
        toast.showError(TOAST_MESSAGES.MATCH_CHECK_FAILED);
        console.error("Match check error:", matchCheckError);
        return null;
      }
    },
    [matchCheckApi, toast]
  );

  return {
    matchErrors,
    isCheckingMatch,
    checkMatch,
  };
}

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { classificationApi } from "@/shared/api";
import { useToastContext } from "@/app/providers/ToastProvider";
import { TOAST_MESSAGES, UI_TEXT } from "@/shared/lib/constants";
import type {
  ClassifyContentRequest,
  ClassifyContentResponse,
} from "@/shared/api/types";

interface ResumeData {
  file: File | null;
  text: string;
}

interface ClassificationErrors {
  resumeError?: string;
  jobDescriptionError?: string;
}

interface UseClassifyContentResult {
  classificationErrors: ClassificationErrors;
  isClassifying: boolean;
  classifyContent: (
    resumeData: ResumeData | null,
    jobDescriptionText: string,
    mode?: "edit" | "tailor"
  ) => Promise<{ extractedResumeText: string | null; isValid: boolean } | null>;
}

export function useClassifyContent(): UseClassifyContentResult {
  const toast = useToastContext();
  const [classificationErrors, setClassificationErrors] =
    useState<ClassificationErrors>({});

  const { mutateAsync: classifyContentApi, isPending: isClassifying } =
    useMutation<
      ClassifyContentResponse,
      Error,
      { request: ClassifyContentRequest; mode?: "edit" | "tailor" }
    >({
      mutationFn: ({ request, mode }) =>
        classificationApi.classify(request, mode),
    });

  const classifyContent = useCallback(
    async (
      resumeData: ResumeData | null,
      jobDescriptionText: string,
      mode?: "edit" | "tailor"
    ): Promise<{
      extractedResumeText: string | null;
      isValid: boolean;
    } | null> => {
      if (!resumeData || (!resumeData.text && !resumeData.file)) {
        toast.showError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
        return null;
      }

      const classificationToastId = toast.showLoading(
        TOAST_MESSAGES.CLASSIFYING_CONTENT
      );

      try {
        const classificationResult = await classifyContentApi({
          request: {
            file: resumeData.file || undefined,
            resumeText: resumeData.text || undefined,
            jobText: jobDescriptionText,
          },
          mode,
        });

        toast.dismissLoading(classificationToastId);

        const extractedText =
          classificationResult.extractedResumeText || resumeData.text || null;

        // For edit mode, only check resume validity
        const isJobDescriptionValid =
          mode === "edit" || classificationResult.isJobDescriptionValid;

        if (!classificationResult.isResumeValid || !isJobDescriptionValid) {
          setClassificationErrors({
            resumeError: classificationResult.isResumeValid
              ? undefined
              : classificationResult.resumeReason ||
                UI_TEXT.RESUME_CLASSIFICATION_FAILED,
            jobDescriptionError:
              mode === "edit" || classificationResult.isJobDescriptionValid
                ? undefined
                : classificationResult.jobDescriptionReason ||
                  UI_TEXT.JOB_DESCRIPTION_CLASSIFICATION_FAILED,
          });
          return { extractedResumeText: extractedText, isValid: false };
        }

        setClassificationErrors({});
        return { extractedResumeText: extractedText, isValid: true };
      } catch (classificationError) {
        toast.dismissLoading(classificationToastId);
        toast.showError(TOAST_MESSAGES.CLASSIFICATION_FAILED);
        console.error("Classification error:", classificationError);
        return null;
      }
    },
    [classifyContentApi, toast]
  );

  return {
    classificationErrors,
    isClassifying,
    classifyContent,
  };
}

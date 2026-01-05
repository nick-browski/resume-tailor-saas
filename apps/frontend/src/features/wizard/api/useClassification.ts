import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { classificationApi } from "@/shared/api";
import { useToastContext } from "@/app/providers/ToastProvider";
import { TOAST_MESSAGES, UI_TEXT } from "@/shared/lib/constants";
import type {
  ClassifyContentRequest,
  ClassifyContentResponse,
  ResumeInputData,
} from "@/shared/api/types";

interface ClassificationErrors {
  resumeError?: string;
  jobDescriptionError?: string;
  editRequestError?: string;
}

interface UseClassifyContentResult {
  classificationErrors: ClassificationErrors;
  isClassifying: boolean;
  classifyContent: (
    resumeData: ResumeInputData | null,
    jobDescriptionText: string,
    mode?: "edit" | "tailor",
    editPrompt?: string
  ) => Promise<{ extractedResumeText: string | null; isValid: boolean } | null>;
  classifyContentForEdit: (
    resumeData: ResumeInputData | null,
    editRequestText: string
  ) => Promise<{ extractedResumeText: string | null; isValid: boolean } | null>;
  classifyContentForTailor: (
    resumeData: ResumeInputData | null,
    jobDescriptionText: string
  ) => Promise<{ extractedResumeText: string | null; isValid: boolean } | null>;
  clearClassificationErrors: () => void;
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

  const classifyContentForEdit = useCallback(
    async (
      resumeData: ResumeInputData | null,
      editRequestText: string
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
            editPrompt: editRequestText,
          },
          mode: "edit",
        });

        toast.dismissLoading(classificationToastId);

        const extractedResumeText =
          classificationResult.extractedResumeText || resumeData.text || null;

        const isResumeValid = classificationResult.isResumeValid;
        const isEditRequestValid =
          classificationResult.isEditRequestValid !== false;

        if (!isResumeValid || !isEditRequestValid) {
          setClassificationErrors({
            resumeError: isResumeValid
              ? undefined
              : classificationResult.resumeReason ||
                UI_TEXT.RESUME_CLASSIFICATION_FAILED,
            editRequestError: !isEditRequestValid
              ? classificationResult.editRequestReason ||
                "Edit request must be a specific, logical description of changes"
              : undefined,
          });
          return { extractedResumeText, isValid: false };
        }

        setClassificationErrors({});
        return { extractedResumeText, isValid: true };
      } catch (classificationError) {
        toast.dismissLoading(classificationToastId);
        toast.showError(TOAST_MESSAGES.CLASSIFICATION_FAILED);
        console.error("Classification error:", classificationError);
        return null;
      }
    },
    [classifyContentApi, toast]
  );

  const classifyContentForTailor = useCallback(
    async (
      resumeData: ResumeInputData | null,
      jobDescriptionText: string
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
          mode: "tailor",
        });

        toast.dismissLoading(classificationToastId);

        const extractedResumeText =
          classificationResult.extractedResumeText || resumeData.text || null;

        const isResumeValid = classificationResult.isResumeValid;
        const isJobDescriptionValid =
          classificationResult.isJobDescriptionValid !== false;

        if (!isResumeValid || !isJobDescriptionValid) {
          setClassificationErrors({
            resumeError: isResumeValid
              ? undefined
              : classificationResult.resumeReason ||
                UI_TEXT.RESUME_CLASSIFICATION_FAILED,
            jobDescriptionError: isJobDescriptionValid
              ? undefined
              : classificationResult.jobDescriptionReason ||
                UI_TEXT.JOB_DESCRIPTION_CLASSIFICATION_FAILED,
          });
          return { extractedResumeText, isValid: false };
        }

        setClassificationErrors({});
        return { extractedResumeText, isValid: true };
      } catch (classificationError) {
        toast.dismissLoading(classificationToastId);
        toast.showError(TOAST_MESSAGES.CLASSIFICATION_FAILED);
        console.error("Classification error:", classificationError);
        return null;
      }
    },
    [classifyContentApi, toast]
  );

  const classifyContent = useCallback(
    async (
      resumeData: ResumeInputData | null,
      jobDescriptionText: string,
      mode?: "edit" | "tailor",
      editPrompt?: string
    ): Promise<{
      extractedResumeText: string | null;
      isValid: boolean;
    } | null> => {
      if (mode === "edit") {
        if (!editPrompt) {
          toast.showError(UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR);
          return null;
        }
        return classifyContentForEdit(resumeData, editPrompt);
      }

      return classifyContentForTailor(resumeData, jobDescriptionText);
    },
    [classifyContentForEdit, classifyContentForTailor, toast]
  );

  const clearClassificationErrors = useCallback(() => {
    setClassificationErrors({});
  }, []);

  return {
    classificationErrors,
    isClassifying,
    classifyContent,
    classifyContentForEdit,
    classifyContentForTailor,
    clearClassificationErrors,
  };
}

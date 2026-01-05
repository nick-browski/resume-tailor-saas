import { useCallback } from "react";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import {
  validateFile,
  validateResumeText,
  validateEditPrompt,
} from "../schemas";
import { useCreateDocument } from "../api/useDocuments";
import { generateApi } from "@/shared/api";
import {
  UI_TEXT,
  UPLOAD_MODE,
  VALIDATION_CONSTANTS,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { formatServerError } from "@/shared/lib/errorFormatter";

interface ResumeData {
  file: File | null;
  text: string;
}

interface UseEditAndTransformProps {
  uploadMode: "file" | "text";
  resumeData: ResumeData | null;
  documentId: string | null;
  editPrompt: string;
  classifyContent: (
    resumeData: ResumeData | null,
    jobDescriptionText: string,
    mode?: "edit" | "tailor"
  ) => Promise<{ extractedResumeText: string | null; isValid: boolean } | null>;
  onValidationError: (error: string | null) => void;
  onEditPromptError: (error: string | null) => void;
  onNext: () => void;
}

export function useEditAndTransform({
  uploadMode,
  resumeData,
  documentId,
  editPrompt,
  classifyContent,
  onValidationError,
  onEditPromptError,
  onNext,
}: UseEditAndTransformProps) {
  const setDocumentId = useWizardStore((state) => state.setDocumentId);
  const setEditPromptInStore = useWizardStore((state) => state.setEditPrompt);
  const reset = useWizardStore((state) => state.reset);
  const toast = useToastContext();
  const { mutateAsync: createDocument } = useCreateDocument();

  const handleEditAndTransform = useCallback(async () => {
    // Validate resume
    if (uploadMode === UPLOAD_MODE.FILE) {
      if (!resumeData?.file) {
        onValidationError(UI_TEXT.FILE_REQUIRED_ERROR);
        toast.showError(UI_TEXT.PLEASE_SELECT_FILE);
        return false;
      }
      const fileValidationResult = await validateFile(resumeData.file);
      if (!fileValidationResult.success) {
        onValidationError(fileValidationResult.error || null);
        return false;
      }
    } else {
      if (!resumeData?.text?.trim()) {
        onValidationError(
          UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
            VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
          )
        );
        toast.showError(UI_TEXT.PLEASE_ENTER_RESUME_TEXT);
        return false;
      }
      const textValidationResult = validateResumeText(resumeData.text);
      if (!textValidationResult.success) {
        onValidationError(textValidationResult.error || null);
        return false;
      }
    }

    // Validate edit prompt (required)
    if (!editPrompt || !editPrompt.trim()) {
      onEditPromptError(UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR);
      toast.showError(UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR);
      return false;
    }
    const editPromptValidationResult = validateEditPrompt(editPrompt);
    if (!editPromptValidationResult.success) {
      onEditPromptError(editPromptValidationResult.error || null);
      return false;
    }

    try {
      const classificationResult = await classifyContent(
        resumeData,
        "",
        "edit"
      );

      if (!classificationResult || !classificationResult.isValid) {
        return false;
      }

      let currentDocumentId = documentId;
      if (!currentDocumentId) {
        const createDocumentToastId = toast.showLoading(
          TOAST_MESSAGES.CREATING_DOCUMENT
        );
        try {
          const createDocumentResponse = await createDocument({
            file: resumeData?.file || undefined,
            resumeText: classificationResult.extractedResumeText || undefined,
          });
          toast.dismissLoading(createDocumentToastId);
          currentDocumentId = createDocumentResponse.id;
          setDocumentId(currentDocumentId);
        } catch (createDocumentError) {
          toast.dismissLoading(createDocumentToastId);
          const errorMessage = formatServerError(createDocumentError);
          toast.showError(errorMessage);
          return false;
        }
      }

      try {
        await generateApi.editResume({
          documentId: currentDocumentId,
          prompt: editPrompt,
        });
      } catch (editError) {
        const errorMessage = formatServerError(editError);
        toast.showError(errorMessage);
        return false;
      }

      setEditPromptInStore(null);
      onNext();
      return true;
    } catch (error) {
      const errorMessage = formatServerError(error);
      toast.showError(errorMessage);
      reset();
      return false;
    }
  }, [
    uploadMode,
    resumeData,
    documentId,
    editPrompt,
    createDocument,
    setDocumentId,
    setEditPromptInStore,
    classifyContent,
    onNext,
    toast,
    onValidationError,
    onEditPromptError,
    reset,
  ]);

  return { handleEditAndTransform };
}

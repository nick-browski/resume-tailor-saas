import { useCallback } from "react";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { validateFile } from "../schemas";
import { UI_TEXT } from "@/shared/lib/constants";

interface UseFileUploadProps {
  isGenerationInProgress: boolean;
  hasAttemptedSubmit: boolean;
  onValidationError: (error: string | null) => void;
}

export function useFileUpload({
  isGenerationInProgress,
  hasAttemptedSubmit,
  onValidationError,
}: UseFileUploadProps) {
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const toast = useToastContext();

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (isGenerationInProgress) return;
      setResumeData({ file: selectedFile, text: "" });
      if (hasAttemptedSubmit) {
        const fileValidationResult = await validateFile(selectedFile);
        onValidationError(
          fileValidationResult.success
            ? null
            : fileValidationResult.error || null
        );
      } else {
        onValidationError(null);
      }
      toast.showSuccess(UI_TEXT.FILE_SELECTED_SUCCESS);
    },
    [
      isGenerationInProgress,
      setResumeData,
      toast,
      hasAttemptedSubmit,
      onValidationError,
    ]
  );

  const handleFileInputChange = useCallback(
    async (fileInputChangeEvent: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = fileInputChangeEvent.target.files?.[0];
      if (selectedFile) {
        await handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (fileDragOverEvent: React.DragEvent<HTMLDivElement>) => {
      fileDragOverEvent.preventDefault();
      fileDragOverEvent.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    async (fileDropEvent: React.DragEvent<HTMLDivElement>) => {
      fileDropEvent.preventDefault();
      fileDropEvent.stopPropagation();
      const droppedFile = fileDropEvent.dataTransfer.files?.[0];
      if (droppedFile) {
        await handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    if (isGenerationInProgress) return;
    setResumeData({
      file: null,
      text: "",
    });
    onValidationError(null);
  }, [isGenerationInProgress, setResumeData, onValidationError]);

  return {
    handleFileSelect,
    handleFileInputChange,
    handleDragOver,
    handleDrop,
    handleRemoveFile,
  };
}

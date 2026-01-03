import { useState, useEffect } from "react";
import { UPLOAD_MODE, UI_TEXT } from "@/shared/lib/constants";
import { validateFile, validateResumeText } from "../schemas";

interface ResumeData {
  file: File | null;
  text: string;
}

export function useResumeValidation(
  resumeData: ResumeData | null,
  uploadMode: "file" | "text"
): string | null {
  const [resumeValidationError, setResumeValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkResumeValidity = async () => {
      if (!resumeData) {
        setResumeValidationError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
        return;
      }

      if (uploadMode === UPLOAD_MODE.FILE) {
        if (!resumeData.file) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
          return;
        }
        const fileValidationResult = await validateFile(resumeData.file);
        if (!fileValidationResult.success) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_VALID_WARNING);
          return;
        }
      } else {
        if (!resumeData.text?.trim()) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
          return;
        }
        const textValidationResult = validateResumeText(resumeData.text);
        if (!textValidationResult.success) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_VALID_WARNING);
          return;
        }
      }

      setResumeValidationError(null);
    };

    checkResumeValidity();
  }, [resumeData, uploadMode]);

  return resumeValidationError;
}

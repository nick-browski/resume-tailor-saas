import { useState, useEffect } from "react";
import { UI_TEXT } from "@/shared/lib/constants";
import { validateFile, validateResumeText } from "../schemas";
import type { ResumeInputData } from "@/shared/api/types";

export function useResumeValidation(
  resumeData: ResumeInputData | null,
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

      const hasFile = !!resumeData.file;
      const hasText = !!resumeData.text?.trim();

      if (hasFile && resumeData.file) {
        const fileValidationResult = await validateFile(resumeData.file);
        if (!fileValidationResult.success) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_VALID_WARNING);
          return;
        }
      } else if (hasText) {
        const textValidationResult = validateResumeText(resumeData.text);
        if (!textValidationResult.success) {
          setResumeValidationError(UI_TEXT.RESUME_NOT_VALID_WARNING);
          return;
        }
      } else {
        setResumeValidationError(UI_TEXT.RESUME_NOT_SELECTED_WARNING);
        return;
      }

      setResumeValidationError(null);
    };

    checkResumeValidity();
  }, [resumeData, uploadMode]);

  return resumeValidationError;
}

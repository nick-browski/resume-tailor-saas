import { useCallback, useEffect } from "react";
import {
  TEXTAREA_CONSTANTS,
  UI_TEXT,
  UPLOAD_MODE,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { FileUploadArea, UploadedFileCard } from "@/shared/ui";
import { useWizardStore } from "../../model/wizardStore";
import { validateResumeText } from "../../schemas";
import { ValidationHint } from "../validation";
import { useFileUpload } from "../../hooks/useFileUpload";

interface ResumeUploadSectionProps {
  isGenerationInProgress: boolean;
  hasAttemptedSubmit: boolean;
  validationError: string | null;
  onValidationError: (error: string | null) => void;
}

export function ResumeUploadSection({
  isGenerationInProgress,
  hasAttemptedSubmit,
  validationError,
  onValidationError,
}: ResumeUploadSectionProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const setUploadMode = useWizardStore((state) => state.setUploadMode);
  const setResumeData = useWizardStore((state) => state.setResumeData);

  useEffect(() => {
    onValidationError(null);
  }, [uploadMode, onValidationError]);

  const { handleFileSelect, handleRemoveFile } = useFileUpload({
    isGenerationInProgress,
    hasAttemptedSubmit,
    onValidationError,
  });

  const resumeTextContent =
    uploadMode === UPLOAD_MODE.TEXT ? resumeData?.text || "" : "";

  const handleResumeTextChange = useCallback(
    (textAreaChangeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isGenerationInProgress) return;
      const resumeTextValue = textAreaChangeEvent.target.value;
      setResumeData({ file: null, text: resumeTextValue });
      if (hasAttemptedSubmit && resumeTextValue.trim()) {
        const textValidationResult = validateResumeText(resumeTextValue);
        onValidationError(
          textValidationResult.success
            ? null
            : textValidationResult.error || null
        );
      } else {
        onValidationError(null);
      }
    },
    [
      isGenerationInProgress,
      setResumeData,
      hasAttemptedSubmit,
      onValidationError,
    ]
  );

  return (
    <>
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={() => setUploadMode(UPLOAD_MODE.FILE)}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium transition-colors touch-manipulation ${
            uploadMode === UPLOAD_MODE.FILE
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.UPLOAD_PDF_BUTTON}
        </button>
        <button
          type="button"
          onClick={() => setUploadMode(UPLOAD_MODE.TEXT)}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium transition-colors touch-manipulation ${
            uploadMode === UPLOAD_MODE.TEXT
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.PASTE_TEXT_BUTTON}
        </button>
      </div>

      {uploadMode === UPLOAD_MODE.FILE && (
        <div>
          <label className="block mb-3 text-sm font-semibold text-gray-900">
            {UI_TEXT.RESUME_PDF_LABEL}
          </label>

          {resumeData?.file ? (
            <div className="space-y-3">
              <UploadedFileCard
                fileName={resumeData.file.name}
                fileSizeBytes={resumeData.file.size}
                onReplace={handleFileSelect}
                onRemove={handleRemoveFile}
                disabled={isGenerationInProgress}
              />
              <ValidationHint
                hasAttemptedSubmit={hasAttemptedSubmit}
                validationError={validationError}
                hintText={UI_TEXT.FILE_VALIDATION_HINT}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <FileUploadArea
                onFileSelect={handleFileSelect}
                disabled={isGenerationInProgress}
                hasError={hasAttemptedSubmit && !!validationError}
              />
              <ValidationHint
                hasAttemptedSubmit={hasAttemptedSubmit}
                validationError={validationError}
                hintText={UI_TEXT.FILE_VALIDATION_HINT}
              />
            </div>
          )}
        </div>
      )}

      {uploadMode === UPLOAD_MODE.TEXT && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {UI_TEXT.RESUME_TEXT_LABEL}
          </label>
          <textarea
            value={resumeTextContent}
            onChange={handleResumeTextChange}
            rows={TEXTAREA_CONSTANTS.RESUME_ROWS}
            className={`w-full px-3 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none transition-colors ${
              hasAttemptedSubmit && validationError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            placeholder={UI_TEXT.RESUME_TEXT_PLACEHOLDER}
          />
          <ValidationHint
            hasAttemptedSubmit={hasAttemptedSubmit}
            validationError={validationError}
            hintText={UI_TEXT.TEXT_VALIDATION_HINT}
            currentLength={
              resumeTextContent ? resumeTextContent.length : undefined
            }
            maxLength={VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH}
          />
        </div>
      )}
    </>
  );
}

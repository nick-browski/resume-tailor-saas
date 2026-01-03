import { useCallback, useState, useEffect } from "react";
import {
  TEXTAREA_CONSTANTS,
  DOCUMENT_STATUS,
  UI_TEXT,
  UPLOAD_MODE,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { FileUploadArea, UploadedFileCard } from "@/shared/ui";
import { useWizardStore } from "../../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { useDocumentById } from "../../../api/useDocuments";
import { validateFile, validateResumeText } from "../../../schemas";
import { ValidationHint } from "../../validation";

interface UploadResumeStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function UploadResumeStep({
  onNext,
  onPrevious,
}: UploadResumeStepProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const setUploadMode = useWizardStore((state) => state.setUploadMode);
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const { data: currentDocument } = useDocumentById(documentId);
  const toast = useToastContext();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Generation is in progress if:
  // 1. generationToastId exists (toast is visible) OR
  // 2. document exists and status is not final (GENERATED or FAILED)
  const isGenerationInProgress =
    !!generationToastId ||
    (documentId !== null &&
      currentDocument?.status !== undefined &&
      currentDocument.status !== DOCUMENT_STATUS.GENERATED &&
      currentDocument.status !== DOCUMENT_STATUS.FAILED);

  const resumeTextContent =
    uploadMode === UPLOAD_MODE.TEXT ? resumeData?.text || "" : "";

  useEffect(() => {
    setValidationError(null);
    setHasAttemptedSubmit(false);
  }, [uploadMode]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (isGenerationInProgress) return;
      setResumeData({ file: selectedFile, text: "" });
      if (hasAttemptedSubmit) {
        const validationResult = await validateFile(selectedFile);
        setValidationError(
          validationResult.success ? null : validationResult.error || null
        );
      } else {
        setValidationError(null);
      }
      toast.showSuccess(UI_TEXT.FILE_SELECTED_SUCCESS);
    },
    [isGenerationInProgress, setResumeData, toast, hasAttemptedSubmit]
  );

  const handleResumeTextChange = useCallback(
    (textAreaChangeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isGenerationInProgress) return;
      const resumeTextValue = textAreaChangeEvent.target.value;
      setResumeData({ file: null, text: resumeTextValue });
      if (hasAttemptedSubmit && resumeTextValue.trim()) {
        const validationResult = validateResumeText(resumeTextValue);
        setValidationError(
          validationResult.success ? null : validationResult.error || null
        );
      } else {
        setValidationError(null);
      }
    },
    [isGenerationInProgress, setResumeData, hasAttemptedSubmit]
  );

  const handleRemoveFile = useCallback(() => {
    if (isGenerationInProgress) return;

    setResumeData({
      file: null,
      text: "",
    });
    setValidationError(null);
    setHasAttemptedSubmit(false);
  }, [isGenerationInProgress, setResumeData]);

  const handleFormSubmit = useCallback(
    async (formSubmitEventHandler: React.FormEvent) => {
      formSubmitEventHandler.preventDefault();
      if (isGenerationInProgress) return;

      setHasAttemptedSubmit(true);

      if (uploadMode === UPLOAD_MODE.FILE) {
        if (!resumeData?.file) {
          setValidationError(UI_TEXT.FILE_REQUIRED_ERROR);
          toast.showError(UI_TEXT.PLEASE_SELECT_FILE);
          return;
        }
        const fileValidationResult = await validateFile(resumeData.file);
        if (!fileValidationResult.success) {
          setValidationError(fileValidationResult.error || null);
          return;
        }
      } else {
        if (!resumeData?.text?.trim()) {
          setValidationError(
            UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
              VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
            )
          );
          toast.showError(UI_TEXT.PLEASE_ENTER_RESUME_TEXT);
          return;
        }
        const textValidationResult = validateResumeText(resumeData.text);
        if (!textValidationResult.success) {
          setValidationError(textValidationResult.error || null);
          return;
        }
      }

      toast.showSuccess(
        uploadMode === UPLOAD_MODE.FILE
          ? UI_TEXT.RESUME_UPLOADED_SUCCESS
          : UI_TEXT.RESUME_TEXT_SAVED
      );
      onNext();
    },
    [uploadMode, resumeData, onNext, toast, isGenerationInProgress]
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          {UI_TEXT.UPLOAD_RESUME_STEP_TITLE}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UI_TEXT.UPLOAD_RESUME_STEP_DESCRIPTION}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={() =>
            !isGenerationInProgress && setUploadMode(UPLOAD_MODE.FILE)
          }
          disabled={isGenerationInProgress}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            uploadMode === UPLOAD_MODE.FILE
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.UPLOAD_PDF_BUTTON}
        </button>
        <button
          type="button"
          onClick={() =>
            !isGenerationInProgress && setUploadMode(UPLOAD_MODE.TEXT)
          }
          disabled={isGenerationInProgress}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
            className={`w-full px-3 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors ${
              hasAttemptedSubmit && validationError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            placeholder={UI_TEXT.RESUME_TEXT_PLACEHOLDER}
            disabled={isGenerationInProgress}
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

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-white text-gray-700 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
        >
          {UI_TEXT.BACK_BUTTON}
        </button>
        <button
          type="submit"
          disabled={isGenerationInProgress}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {UI_TEXT.CONTINUE_BUTTON}
        </button>
      </div>
    </form>
  );
}

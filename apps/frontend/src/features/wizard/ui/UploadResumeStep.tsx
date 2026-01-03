import { useCallback, useState, useEffect } from "react";
import {
  FILE_CONSTANTS,
  TEXTAREA_CONSTANTS,
  DOCUMENT_STATUS,
  UI_TEXT,
  UPLOAD_MODE,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { useDocumentById } from "../api/useDocuments";
import { validateFile, validateResumeText } from "../schemas";

interface UploadResumeStepProps {
  onNext: () => void;
}

export function UploadResumeStep({ onNext }: UploadResumeStepProps) {
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
    [setResumeData, toast, hasAttemptedSubmit]
  );

  const handleFileInputChange = useCallback(
    async (fileInputChangeEvent: React.ChangeEvent<HTMLInputElement>) => {
      if (isGenerationInProgress) return;
      const selectedFile = fileInputChangeEvent.target.files?.[0];
      if (selectedFile) {
        await handleFileSelect(selectedFile);
      }
    },
    [isGenerationInProgress, handleFileSelect]
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

  const handleDragOver = useCallback(
    (fileDragOverEvent: React.DragEvent<HTMLDivElement>) => {
      if (isGenerationInProgress) {
        fileDragOverEvent.preventDefault();
        return;
      }
      fileDragOverEvent.preventDefault();
      fileDragOverEvent.stopPropagation();
    },
    [isGenerationInProgress]
  );

  const handleDrop = useCallback(
    async (fileDropEvent: React.DragEvent<HTMLDivElement>) => {
      if (isGenerationInProgress) return;
      fileDropEvent.preventDefault();
      fileDropEvent.stopPropagation();
      const droppedFile = fileDropEvent.dataTransfer.files?.[0];
      if (droppedFile) {
        await handleFileSelect(droppedFile);
      }
    },
    [isGenerationInProgress, handleFileSelect]
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
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {UI_TEXT.RESUME_PDF_LABEL}
          </label>

          {resumeData?.file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {resumeData.file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(
                        resumeData.file.size /
                        (FILE_CONSTANTS.BYTES_PER_KB *
                          FILE_CONSTANTS.BYTES_PER_KB)
                      ).toFixed(2)}{" "}
                      {UI_TEXT.FILE_SIZE_UNIT}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="relative cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <span>{UI_TEXT.CHANGE_FILE_TEXT}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept={FILE_CONSTANTS.ACCEPTED_TYPES}
                      onChange={handleFileInputChange}
                      disabled={isGenerationInProgress}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={isGenerationInProgress}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    aria-label={UI_TEXT.REMOVE_FILE_ARIA_LABEL}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                {hasAttemptedSubmit && validationError ? (
                  <p className="text-sm text-red-600">{validationError}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {UI_TEXT.FILE_VALIDATION_HINT}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`mt-1 flex justify-center px-3 sm:px-6 pt-8 sm:pt-10 pb-8 sm:pb-10 border-2 border-dashed rounded-lg transition-colors ${
                  isGenerationInProgress
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed pointer-events-none"
                    : hasAttemptedSubmit && validationError
                    ? "border-red-300 bg-red-50 hover:border-red-400"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                }`}
              >
                <div className="space-y-3 text-center w-full">
                  <svg
                    className={`mx-auto h-12 w-12 transition-colors ${
                      hasAttemptedSubmit && validationError
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="space-y-1">
                    <label className="relative inline-block">
                      <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md cursor-pointer hover:bg-blue-50 transition-colors">
                        {UI_TEXT.UPLOAD_FILE_TEXT}
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        accept={FILE_CONSTANTS.ACCEPTED_TYPES}
                        onChange={handleFileInputChange}
                        disabled={isGenerationInProgress}
                      />
                    </label>
                    <p className="text-sm text-gray-500">
                      {UI_TEXT.DRAG_AND_DROP_TEXT}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {UI_TEXT.PDF_SIZE_LIMIT_TEXT} {FILE_CONSTANTS.MAX_SIZE_MB}MB
                  </p>
                </div>
              </div>
              <div>
                {hasAttemptedSubmit && validationError ? (
                  <p className="text-sm text-red-600">{validationError}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {UI_TEXT.FILE_VALIDATION_HINT}
                  </p>
                )}
              </div>
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
          <div className="mt-2 flex items-center justify-between">
            <div>
              {hasAttemptedSubmit && validationError ? (
                <p className="text-sm text-red-600">{validationError}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {UI_TEXT.TEXT_VALIDATION_HINT}
                </p>
              )}
            </div>
            {resumeTextContent && (
              <p className="text-sm text-gray-500">
                {resumeTextContent.length.toLocaleString()} /{" "}
                {VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH.toLocaleString()}{" "}
                {UI_TEXT.CHARACTERS_LABEL}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
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
